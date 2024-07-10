const { selectAllFrom, bulkCreate, selectOneById } = require('../../db')
const { SISStudyRight, SISStudyRightElement } = require('../../db/models')
const { termRegistrationTypeToEnrollmenttype } = require('../mapper')
const {
  getEducation,
  getSemester,
  getEducationType,
  educationTypeToExtentcode,
  getOrganisationCode,
} = require('../shared')

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

const getStudyRightSemesterEnrollments = (studyright, semesterEnrollments) => {
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
    semesterEnrollments: getStudyRightSemesterEnrollments(studyRight, semesterEnrollmentsForStudyRight),
    facultyCode: getOrganisationCode(studyRight.organisation_id),
  }
}

const isFirstProgramme = index => index === 0

const isLastProgramme = (programmes, index) => index === programmes.length - 1

const getCorrectStartDateForProgramme = (phase, isFirstProgramme, latestSnapshot, startDateFromSnapshot) => {
  if (phase === 1) {
    return isFirstProgramme ? new Date(latestSnapshot.valid.startDate) : startDateFromSnapshot
  }
  if (!latestSnapshot.study_right_graduation?.phase1GraduationDate) return null
  return isFirstProgramme
    ? addDaysToDate(latestSnapshot.study_right_graduation.phase1GraduationDate, 1)
    : startDateFromSnapshot
}

// Each programme (educationPhaseNGroupId) has their own study right element. Study tracks (educationPhaseNChildGroupId) belong to the corresponding study right element.
const studyRightElementMapper =
  (programmes, latestSnapshot, moduleGroupIdToCode, phase, studyTracks) =>
  async ([moduleGroupId, startDate], index) => {
    const code = moduleGroupIdToCode[moduleGroupId]
    const correctStartDate = getCorrectStartDateForProgramme(phase, isFirstProgramme(index), latestSnapshot, startDate)

    if (!code || !correctStartDate) return null

    const educationInfo = await selectOneById('modules', moduleGroupId.replace('EDU', 'DP'), 'group_id')
    let endDate
    if (isLastProgramme(programmes, index)) {
      endDate =
        latestSnapshot.study_right_graduation?.[`phase${phase}GraduationDate`] ??
        addDaysToDate(latestSnapshot.valid.endDate, -1)
    } else {
      const nextProgrammeStartDate = new Date(programmes[index + 1][1])
      if (nextProgrammeStartDate.toDateString() === new Date(correctStartDate).toDateString()) {
        endDate = nextProgrammeStartDate
      } else {
        endDate = addDaysToDate(nextProgrammeStartDate, -1)
      }
    }

    // Graduation only set for the latest programme
    const graduated =
      latestSnapshot.study_right_graduation?.[`phase${phase}GraduationDate`] != null &&
      isLastProgramme(programmes, index)

    let studyTrack = studyTracks[moduleGroupId] ?? null

    if (studyTrack) {
      const studyTrackCode = moduleGroupIdToCode[studyTrack]
      const studyTrackInfo = await selectOneById('modules', studyTrack, 'group_id')
      studyTrack = { code: studyTrackCode, name: studyTrackInfo?.name }
    }

    return {
      startDate: correctStartDate,
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

const findFirstSnapshotDatesForProgrammesAndStudytracks = studyRightSnapshots => {
  const phase1ProgrammeStartDates = {}
  const phase2ProgrammeStartDates = {}
  const phase1StudyTracks = {}
  const phase2StudyTracks = {}

  const newestProgramme = programmes => Object.entries(programmes).sort((a, b) => b[1] - a[1])[0][0]

  for (let i = studyRightSnapshots.length - 1; i >= 0; i--) {
    const snapshot = studyRightSnapshots[i]
    const { snapshot_date_time, accepted_selection_path, valid } = snapshot
    if (!accepted_selection_path) continue

    const { educationPhase1GroupId, educationPhase1ChildGroupId, educationPhase2GroupId, educationPhase2ChildGroupId } =
      accepted_selection_path
    const normalizedDateTime = normalizeDateTime(new Date(snapshot_date_time ?? valid.startDate))

    if (educationPhase1GroupId) {
      if (!phase1ProgrammeStartDates[educationPhase1GroupId]) {
        phase1ProgrammeStartDates[educationPhase1GroupId] = normalizedDateTime
        // In most cases this shouldn't happen. There are a few rare cases (e.g. study right hy-opinoik-130863612) where the newer programme actually appears first time in an older snapshot than the older programme. In these situations, we want the start date of the newer programme to be after the start date of the older programme.
      } else if (newestProgramme(phase1ProgrammeStartDates) !== educationPhase1GroupId) {
        const anotherProgrammeWithSameDate = Object.keys(phase1ProgrammeStartDates).find(
          groupId => phase1ProgrammeStartDates[groupId].getTime() === normalizedDateTime.getTime()
        )
        // If there are many snapshots with the same date, we treat the last programme as the correct one
        if (anotherProgrammeWithSameDate) {
          delete phase1ProgrammeStartDates[anotherProgrammeWithSameDate]
          continue
        }
        phase1ProgrammeStartDates[educationPhase1GroupId] = normalizedDateTime
      }
    }

    // We only take one study track per group id (programme). Study track from a newer snapshot will replace the previous one.
    if (educationPhase1ChildGroupId) {
      phase1StudyTracks[educationPhase1GroupId] = educationPhase1ChildGroupId
    }

    // If there's no study track in a newer snapshot with the same programme, we conclude that the study track has been removed
    if (!educationPhase1ChildGroupId && phase1StudyTracks[educationPhase1GroupId]) {
      delete phase1StudyTracks[educationPhase1GroupId]
    }

    if (educationPhase2GroupId) {
      if (!phase2ProgrammeStartDates[educationPhase2GroupId]) {
        phase2ProgrammeStartDates[educationPhase2GroupId] = normalizedDateTime
      } else if (newestProgramme(phase2ProgrammeStartDates) !== educationPhase2GroupId) {
        phase2ProgrammeStartDates[educationPhase2GroupId] = normalizedDateTime
      }
    }

    if (educationPhase2ChildGroupId) {
      phase2StudyTracks[educationPhase2GroupId] = educationPhase2ChildGroupId
    }

    if (!educationPhase2ChildGroupId && phase2StudyTracks[educationPhase2GroupId]) {
      delete phase2StudyTracks[educationPhase2GroupId]
    }
  }

  return {
    phase1Programmes: Object.entries(phase1ProgrammeStartDates).sort((a, b) => a[1] - b[1]),
    phase2Programmes: Object.entries(phase2ProgrammeStartDates).sort((a, b) => a[1] - b[1]),
    phase1StudyTracks,
    phase2StudyTracks,
  }
}

const updateSISStudyRights = async (groupedStudyRights, personIdToStudentNumber, semesterEnrollments) => {
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

const updateSISStudyRightElements = async (groupedStudyRights, moduleGroupIdToCode, createdStudyRights) => {
  const studyRightElements = []

  for (const group of groupedStudyRights) {
    const latestSnapshot = group[0]
    // This means that no study right with this id was created, so we don't want to create any study right elements for it either
    if (!createdStudyRights.has(latestSnapshot.id)) continue
    const { phase1Programmes, phase2Programmes, phase1StudyTracks, phase2StudyTracks } =
      findFirstSnapshotDatesForProgrammesAndStudytracks(group)

    if (phase1Programmes.length) {
      const mapStudyRightElement = studyRightElementMapper(
        phase1Programmes,
        latestSnapshot,
        moduleGroupIdToCode,
        1,
        phase1StudyTracks
      )
      const phase1Elements = await Promise.all(phase1Programmes.map(mapStudyRightElement))
      studyRightElements.push(...phase1Elements.filter(Boolean))
    }

    if (phase2Programmes.length) {
      const mapStudyRightElement = studyRightElementMapper(
        phase2Programmes,
        latestSnapshot,
        moduleGroupIdToCode,
        2,
        phase2StudyTracks
      )
      const phase2Elements = await Promise.all(phase2Programmes.map(mapStudyRightElement))
      studyRightElements.push(...phase2Elements.filter(Boolean))
    }
  }

  await bulkCreate(SISStudyRightElement, studyRightElements)
}

module.exports = {
  updateSISStudyRights,
  updateSISStudyRightElements,
}
