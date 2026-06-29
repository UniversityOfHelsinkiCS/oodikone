import { selectAllFrom, bulkCreate, selectOneById, selectLastById } from '../../db/index.js'
import { SISStudyRight, SISStudyRightElement } from '../../db/models/index.js'
import logger from '../../utils/logger.js'
import { termRegistrationTypeToEnrollmenttype } from '../mapper.js'
import {
  getEducation,
  getSemester,
  getEducationType,
  educationTypeToExtentcode,
  getOrganisationCode,
} from '../shared.js'

const TVEX_URN_CODE = 'urn:code:custom:hy-university-root-id:katu:katu1'

// This needs to be done because snapshot date times seem to be saved in UTC time (based on the fact that there are a lot of entries with time being 21:00 or 22:00)
const normalizeDateTime = date =>
  new Date(
    date.toLocaleString('se-SE', { timeZone: 'Europe/Helsinki', year: 'numeric', month: '2-digit', day: '2-digit' })
  )

const addDaysToDate = (date, days) => {
  if (!date) return null
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + days)
  return newDate
}

const getStudyRightSemesterEnrollments = semesterEnrollments => {
  if (!semesterEnrollments || semesterEnrollments.length === 0) return null
  return semesterEnrollments.map(termRegistration => {
    const {
      studyTerm: { termIndex, studyYearStartYear },
      termRegistrationType,
      statutoryAbsence,
    } = termRegistration

    const type = termRegistrationTypeToEnrollmenttype(termRegistrationType)
    const { semestercode: semester } = getSemester(studyYearStartYear, termIndex)
    return type === 2 ? { type, semester, statutoryAbsence } : { type, semester }
  })
}

const studyRightMapper = (personIdToStudentNumber, admissionNamesById, semesterEnrollments) => studyRight => {
  try {
    const semesterEnrollmentsForStudyRight = semesterEnrollments.find(
      ({ study_right_id }) => study_right_id === studyRight.id
    )?.term_registrations
    const studyRightEducation = getEducation(studyRight.education_id)
    if (!studyRightEducation) return null

    const educationType = getEducationType(studyRightEducation.education_type)
    const extentCode = educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id]

    return {
      id: studyRight.id,
      // validityPeriod of a study right always has a start date but not always an end date. The interval is end exclusive so we need to subtract one day from the end date to get the "real" end date.
      startDate: new Date(studyRight.valid.startDate),
      endDate: addDaysToDate(studyRight.valid.endDate, -1),
      studyStartDate: studyRight.study_start_date ? new Date(studyRight.study_start_date) : null,
      // cancellationType is always 'RESCINDED' or 'CANCELLED_BY_ADMINISTRATION'
      cancelled: studyRight.study_right_cancellation != null,
      studentNumber: personIdToStudentNumber[studyRight.person_id],
      extentCode,
      admissionType: admissionNamesById[studyRight.admission_type_urn],
      semesterEnrollments: getStudyRightSemesterEnrollments(semesterEnrollmentsForStudyRight),
      transferInfo: studyRight.study_right_transfer,
      facultyCode: getOrganisationCode(studyRight.organisation_id),
      expirationRuleUrns: studyRight.study_right_expiration_rules_urn,
      tvex: !!studyRight.code_urns?.includes(TVEX_URN_CODE),
    }
  } catch (error) {
    logger.error(`Study right mapping failed for studyRightId ${studyRight.id}`, error)
    return null
  }
}

const getCorrectStartDateForProgramme = (phase, isFirstProgramme, latestSnapshot, startDateFromSnapshot) => {
  if (phase === 1) {
    return isFirstProgramme ? new Date(latestSnapshot.valid.startDate) : startDateFromSnapshot
  }
  if (!latestSnapshot.study_right_graduation?.phase1GraduationDate) return null
  return isFirstProgramme
    ? addDaysToDate(latestSnapshot.study_right_graduation.phase1GraduationDate, 1)
    : startDateFromSnapshot
}

const isLastProgramme = (programmes, index) => index === programmes.length - 1

// Each programme (educationPhase1/2GroupId) has their own study right element.
// Study tracks (educationPhase1/2ChildGroupId) belong to the corresponding study right element.
const studyRightElementMapper =
  (phase, phaseProgrammes, latestSnapshot) =>
  async ([groupId, { startDate, endDate, code, studyTrack: elementStudyTrack }], index) => {
    const educationInfo = await selectOneById('modules', groupId.replace('EDU', 'DP'), 'group_id')

    // Show only for the latest programme of a phase.
    const graduated =
      !!latestSnapshot.study_right_graduation?.[`phase${phase}GraduationDate`] &&
      isLastProgramme(phaseProgrammes, index)

    let studyTrack = elementStudyTrack ?? null
    if (studyTrack) {
      const studyTrackInfo = await selectLastById('modules', studyTrack.id, 'group_id')
      studyTrack = { code: studyTrack.code, name: studyTrackInfo?.name }
    }

    return {
      startDate,
      endDate,
      code,
      name: educationInfo?.name,
      id: `${latestSnapshot.id}-${code}`,
      phase,
      studyRightId: latestSnapshot.id,
      studyTrack,
      graduated,
      degreeProgrammeType: educationInfo?.degree_program_type_urn,
    }
  }

export const updateSISStudyRights = async (groupedStudyRights, personIdToStudentNumber, semesterEnrollments) => {
  const admissionTypes = (await selectAllFrom('admission_types')).reduce(
    (acc, curr) => ({ ...acc, [curr.id]: curr.name.fi }),
    {}
  )
  const mapStudyRight = studyRightMapper(personIdToStudentNumber, admissionTypes, semesterEnrollments)

  // Latest snapshot of each study right
  const latestStudyRights = Object.values(groupedStudyRights).reduce((acc, curr) => {
    acc.push(curr[0])
    return acc
  }, [])

  const formattedStudyRights = latestStudyRights.map(mapStudyRight).filter(Boolean)

  await bulkCreate(SISStudyRight, formattedStudyRights)
  return new Set(formattedStudyRights.map(studyRight => studyRight.id))
}

/**
 * How to studyRightElement:
 *
 * SISU only understands study rights and education phases (there are no elements like in Oodikone).
 * All changes to a study right generate a new snapshot, where the ID remains the same, but other fields can have changes (refer to ORI api docs). The "state" of each snapshot is valid from the snapshot_date_time, until the date_time of the next snapshot.
 *
 * The current programme of a student is fetched from accepted_selection_path, educationPhase1/2GroupIds.
 * Study tracks for said programmes (educations) are under the educationPhase1/2ChildGroupids.
 *
 * If student changes programs within the same study right, *or is migrated to a new degree programme*,
 * this can be seen by observing changes in the said groupIds between snapshots.
 * Therefore, to get the time of transfer, the `snapshotDateTime` of the snapshot where the education has changed is used.
 *
 * If a previous snapshot has no educationGroupId for phase 2, but a following one does, this indicates graduation and moving to the higher (master's level) degree programme, and so on.
 *
 * This iterates through the snapshots in chronological order and creates relevant entities from that.
 *
 * @returns phase 1/2 studyRightElement skeletons containing programme/studytrack codes and start/end dates but missing some key fields
 */
const buildStudyRightElements = (studyRightSnapshots, groupIdToCode) => {
  const latestSnapshot = studyRightSnapshots[0]
  const phase1Elements = {}
  const phase2Elements = {}

  let lastPhase1Id = null
  let lastPhase2Id = null

  for (let i = studyRightSnapshots.length - 1; i >= 0; i--) {
    const snapshot = studyRightSnapshots[i]

    if (!snapshot.accepted_selection_path) continue

    const {
      snapshot_date_time,
      accepted_selection_path: {
        educationPhase1GroupId,
        educationPhase1ChildGroupId,
        educationPhase2GroupId,
        educationPhase2ChildGroupId,
      },
      valid,
    } = snapshot

    // snapshot_date_time is not always defined (at least with some non-degree-leading programmes)
    // In that case fallback to the start of the study rights validity period.
    const normalizedDateTime = normalizeDateTime(snapshot_date_time || valid.startDate)

    const addElementToMap = (phase, phaseElements, groupId) => {
      // Skip elements that don't have id matching to a programme
      if (!(groupId in groupIdToCode)) return

      const isNewGroupId = !(groupId in phaseElements)
      if (isNewGroupId) {
        const startDate = getCorrectStartDateForProgramme(
          phase,
          Object.keys(phaseElements).length === 0,
          latestSnapshot,
          normalizedDateTime
        )
        // Prevent creating elements when there is no startDate.
        // Only such case should be when student would have moved to phase 2 before phase 1 graduation.
        // See for example person hy-hlo-113973109.
        if (startDate) {
          phaseElements[groupId] = {
            startDate,
            code: groupIdToCode[groupId],
          }
        }
      }

      const lastPhaseId = phase === 1 ? lastPhase1Id : lastPhase2Id
      // If the next snapshot has a different groupId for the same phase,
      // we can assume the student has moved programmes.
      // Therefore the previous element must come to an end.
      if (lastPhaseId !== null && lastPhaseId !== groupId) {
        // EXCEPTION: If student seems to move programmes as follows "a" -> "b" -> "a"
        // This is likely a misregistration by some official. In this case drop "b" programme completely.
        // See for example study right hy-opinoik-130863612
        // Oodikone can't display (as of writing) the same study right element twice with different start/enddates.
        if (!isNewGroupId) {
          delete phaseElements[lastPhaseId]
          delete phaseElements[groupId]['endDate']
        } else {
          phaseElements[lastPhaseId]['endDate'] = addDaysToDate(normalizedDateTime, -1)
        }
      }

      if (phase === 1) {
        lastPhase1Id = groupId
      } else {
        lastPhase2Id = groupId
      }
    }

    // If a teacher/administrator/someone makes adjustments to a study right, a new snapshot is created.
    // Sometimes such changes are made to student's phase 1 studies when the student has already moved to phase 2.
    // In this case a new snapshot is created that could be missing the phase 2 entirely,
    // making the ordered-by-date snapshots no longer depict the study right events in chronological order.
    // Solution: if the student is already in phase 2, ignore changes to phase 1 elements.
    // See for example study right hy-opinoik-78676889, order by snapshot_date_time.
    if (educationPhase1GroupId && !lastPhase2Id) {
      addElementToMap(1, phase1Elements, educationPhase1GroupId, lastPhase1Id)
    }

    if (educationPhase2GroupId) {
      addElementToMap(2, phase2Elements, educationPhase2GroupId, lastPhase2Id)
    }

    // We only take one study track per groupId (degree programme).
    // Study track from a newer snapshot will replace the previous one.
    // If there's no study track in a newer snapshot with the same groupId, we conclude that the study track has been removed.
    const addStudyTracks = (groupId, childGroupId, phaseElements) => {
      if (!phaseElements[groupId]) return
      if (childGroupId) {
        phaseElements[groupId]['studyTrack'] = {
          id: childGroupId,
          code: groupIdToCode[childGroupId],
        }
      } else if (!childGroupId && 'studyTrack' in phaseElements[groupId]) {
        delete phaseElements[groupId]['studyTrack']
      }
    }

    addStudyTracks(educationPhase1GroupId, educationPhase1ChildGroupId, phase1Elements)
    addStudyTracks(educationPhase2GroupId, educationPhase2ChildGroupId, phase2Elements)
  }

  const graduations = latestSnapshot.study_right_graduation
  // If student has graduated from a phase, there cannot be any study right elements
  // for the same phase that would have started after the graduation (rare but happens because data is cool).
  // This cleans them up and sets the correct end dates for the phases.
  if (graduations !== null) {
    const addGraduationsToElements = (phaseGraduationDate, phaseElements) => {
      for (const [groupId, data] of Object.entries(phaseElements)) {
        if (new Date(data.startDate) > new Date(phaseGraduationDate)) {
          delete phaseElements[groupId]
        } else {
          phaseElements[groupId]['endDate'] ??= normalizeDateTime(phaseGraduationDate)
        }
      }
    }

    const phase1Graduation = graduations.phase1GraduationDate
    const phase2Graduation = graduations.phase2GraduationDate

    if (phase1Graduation) {
      addGraduationsToElements(phase1Graduation, phase1Elements)
    }

    if (phase2Graduation) {
      addGraduationsToElements(phase2Graduation, phase2Elements)
    }
  }

  // The ongoing not-graduated elements do not yet have end date
  // Add end of studyright's validity period as the end
  // (it overshoots by a day so subtract that)
  const addMissingEndDates = phaseElements => {
    for (const groupId of Object.keys(phaseElements)) {
      phaseElements[groupId]['endDate'] ??= addDaysToDate(latestSnapshot.valid.endDate, -1)
    }
  }

  addMissingEndDates(phase1Elements)
  addMissingEndDates(phase2Elements)

  const byStartDate = (a, b) => new Date(a.startDate) - new Date(b.startDate)

  return {
    phase1Elements: Object.entries(phase1Elements).sort(byStartDate),
    phase2Elements: Object.entries(phase2Elements).sort(byStartDate),
  }
}

export const updateSISStudyRightElements = async (groupedStudyRights, moduleGroupIdToCode, createdStudyRights) => {
  const studyRightElements = []

  for (const group of groupedStudyRights) {
    const latestSnapshot = group[0]
    // This means that no study right with this id was created, so we don't want to create any study right elements for it either
    if (!createdStudyRights.has(latestSnapshot.id)) continue

    const { phase1Elements, phase2Elements } = buildStudyRightElements(group, moduleGroupIdToCode)

    if (phase1Elements.length) {
      const mapper = studyRightElementMapper(1, phase1Elements, latestSnapshot)
      studyRightElements.push(...(await Promise.all(phase1Elements.map(mapper))))
    }

    if (phase2Elements.length) {
      const mapper = studyRightElementMapper(2, phase2Elements, latestSnapshot)
      studyRightElements.push(...(await Promise.all(phase2Elements.map(mapper))))
    }
  }

  await bulkCreate(SISStudyRightElement, studyRightElements)
}
