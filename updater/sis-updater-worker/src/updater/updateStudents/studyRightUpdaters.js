const { get, sortBy, sortedUniqBy, orderBy, uniqBy, flatMap } = require('lodash')

const { selectFromByIds, bulkCreate, selectAllFrom } = require('../../db')
const { ElementDetail, Studyright, StudyrightElement } = require('../../db/models')
const { isBaMa } = require('../../utils')
const { termRegistrationTypeToEnrollmenttype } = require('../mapper')
const {
  getEducation,
  getEducationType,
  getOrganisationCode,
  getUniOrgId,
  getSemester,
  getSemesterByDate,
  educationTypeToExtentcode,
} = require('../shared')

const isCancelled = (studyright, extentcode) => {
  if (
    extentcode === 1 &&
    studyright.study_right_cancellation &&
    ['RESCINDED', 'CANCELLED_BY_ADMINISTRATION', 'PASSIVE'].includes(
      studyright.study_right_cancellation.cancellationType
    ) &&
    !studyright.study_right_graduation
  ) {
    return true
  }
  if (
    extentcode === 2 &&
    studyright.study_right_cancellation &&
    ['RESCINDED', 'CANCELLED_BY_ADMINISTRATION', 'PASSIVE'].includes(
      studyright.study_right_cancellation.cancellationType
    ) &&
    (!studyright.study_right_graduation ||
      (studyright.study_right_graduation && !studyright.study_right_graduation.phase2GraduationDate))
  ) {
    return true
  }
  return false
}

const getStudyrightSemesterEnrollments = (studyright, termRegistrations) => {
  if (!termRegistrations || !Array.isArray(termRegistrations) || termRegistrations.length === 0) return null
  return termRegistrations.map(termRegistration => {
    const {
      studyTerm: { termIndex, studyYearStartYear },
      termRegistrationType,
      statutoryAbsence,
    } = termRegistration

    const enrollmenttype = termRegistrationTypeToEnrollmenttype(termRegistrationType)
    const { semestercode } = getSemester(getUniOrgId(studyright.organisation_id), studyYearStartYear, termIndex)
    return { enrollmenttype, semestercode, statutoryAbsence }
  })
}

const updateStudyRights = async (
  groupedStudyRightSnapshots,
  personIdToStudentNumber,
  personIdToStudyRightIdToPrimality,
  allTermRegistrations
) => {
  const currentSemester = getSemesterByDate(new Date())
  const studyrightMapper = (personIdToStudentNumber, admissionNamesById) => (studyright, overrideProps) => {
    const cancelled = isCancelled(studyright, 1)
    const defaultProps = {
      studyrightid: `${studyright.id}-1`, // duplikaattifix
      actual_studyrightid: studyright.id,
      facultyCode: getOrganisationCode(studyright.organisation_id),
      startdate: studyright.valid.startDate,
      givendate: studyright.grant_date,
      studentStudentnumber: personIdToStudentNumber[studyright.person_id],
      graduated: studyright.study_right_graduation ? 1 : 0,
      studystartdate: studyright.valid.startDate,
      admissionType: admissionNamesById[studyright.admission_type_urn],
      cancelled,
      isBaMa: isBaMa(getEducation(studyright.education_id)),
      semesterEnrollments: getStudyrightSemesterEnrollments(
        studyright,
        allTermRegistrations.find(termRegistration => termRegistration.study_right_id === studyright.id)
          ?.term_registrations
      ),
    }
    return {
      ...defaultProps,
      ...overrideProps,
    }
  }

  const parseActivity = (studyright, termRegistrations, extentCode) => {
    // These are the states which indicate that the study right has been cancelled by student or administration, thus studyright is not active
    // NOT_STARTED means that study right starts in the future.
    if (
      studyright.study_right_cancellation &&
      ['RESCINDED', 'CANCELLED_BY_ADMINISTRATION', 'PASSIVE', 'EXPIRED'].includes(
        studyright.study_right_cancellation.cancellationType
      )
    ) {
      return 0
    }

    // If the student has registered to be absent or attending for this semester, the studyright is active
    if (termRegistrations) {
      const studyrightToUniOrgId = getUniOrgId(studyright.organisation_id)

      const activeSemesters = termRegistrations.reduce((res, curr) => {
        if (!curr || !curr.studyTerm) return res
        const { studyTerm, termRegistrationType } = curr
        const { semestercode } = getSemester(studyrightToUniOrgId, studyTerm.studyYearStartYear, studyTerm.termIndex)
        if (['ATTENDING', 'NONATTENDING'].includes(termRegistrationType)) {
          return res.concat(semestercode)
        }
        return res
      }, [])

      if (activeSemesters.includes(currentSemester.semestercode)) {
        return 1
      }
    }

    // For some rare educations, term registrations are not necessary. Then just check validity from dates.
    if (extentCode === 23) {
      if (
        studyright.valid?.startDate &&
        new Date(studyright.valid.startDate) < new Date() &&
        (!studyright.valid?.endDate || new Date(studyright.valid.endDate) > new Date())
      ) {
        return 1
      }
      return 0
    }

    // Default not active
    return 0
  }

  const parseEndDate = (studyright, phase_number = 1, isBaMa = false) => {
    // Set eternal studyright enddate to match what we used to use in oodi-oodikone
    // instead of showing it as "Unavailable" in frontend
    const isEternalStudyRight = studyright =>
      studyright &&
      studyright.study_right_expiration_rules_urn &&
      studyright.study_right_expiration_rules_urn.includes('urn:code:study-right-expiration-rules:eternal')

    if (isEternalStudyRight(studyright)) studyright.valid.endDate = '2112-12-21'

    if (isBaMa && phase_number === 2) {
      return studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate
        ? studyright.study_right_graduation.phase2GraduationDate
        : studyright.valid.endDate
    }
    return studyright.study_right_graduation
      ? studyright.study_right_graduation.phase1GraduationDate
      : studyright.valid.endDate
  }

  const parsePriorityCode = (studyright, phase_number = 1, isBaMa = false) => {
    const primality = get(personIdToStudyRightIdToPrimality, `${studyright.person_id}.${studyright.id}`)
    const primalityEndDate = get(primality, 'end_date')
    const isPrimality = primality && !primalityEndDate

    const PRIORITYCODES = {
      MAIN: 1,
      SECONDARY: 2,
      GRADUATED: 30,
      OPTION: 6,
    }

    if (!isBaMa || phase_number === 1) {
      if (get(studyright, 'study_right_graduation.phase1GraduationDate')) return PRIORITYCODES.GRADUATED
      return isPrimality ? PRIORITYCODES.MAIN : PRIORITYCODES.SECONDARY
    }

    if (get(studyright, 'studyright.study_right_graduation.phase2GraduationDate')) {
      return PRIORITYCODES.GRADUATED
    }

    if (isPrimality) {
      return get(studyright, 'study_right_graduation.phase1GraduationDate') ? PRIORITYCODES.MAIN : PRIORITYCODES.OPTION
    }
    return get(studyright, 'study_right_graduation.phase1GraduationDate')
      ? PRIORITYCODES.SECONDARY
      : PRIORITYCODES.OPTION
  }

  const admissionNamesById = (await selectAllFrom('admission_types')).reduce(
    (acc, curr) => ({ ...acc, [curr.id]: curr.name.fi }),
    {}
  )

  const mapStudyright = studyrightMapper(personIdToStudentNumber, admissionNamesById)

  // Take only the latest study rights
  const latestStudyRights = Object.values(groupedStudyRightSnapshots).reduce((acc, curr) => {
    acc.push(curr[0])
    return acc
  }, [])

  const formattedStudyRights = latestStudyRights.reduce((acc, studyright) => {
    const studyRightEducation = getEducation(studyright.education_id)

    const personsTermRegistrations = allTermRegistrations.filter(
      registration => registration.study_right_id === studyright.id
    )
    const termRegistrations = flatMap(personsTermRegistrations, 'term_registrations')

    if (!studyRightEducation) return acc

    if (isBaMa(studyRightEducation)) {
      const studyRightBach = mapStudyright(studyright, {
        extentcode: 1,
        prioritycode: parsePriorityCode(studyright, 1, true),
        active: parseActivity(studyright, termRegistrations, 1),
        enddate: parseEndDate(studyright, 1, true),
      })
      const phase1GraduationDate = studyright.study_right_graduation
        ? new Date(studyright.study_right_graduation.phase1GraduationDate)
        : null
      const studyStartDate = phase1GraduationDate
        ? phase1GraduationDate.setDate(phase1GraduationDate.getDate() + 1)
        : null
      const studyRightMast = mapStudyright(studyright, {
        extentcode: 2,
        prioritycode: parsePriorityCode(studyright, 2, true),
        active: parseActivity(studyright, termRegistrations, 2),
        enddate: parseEndDate(studyright, 2, true),
        studyrightid: `${studyright.id}-2`,
        graduated: studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate ? 1 : 0,
        studystartdate: studyStartDate,
        cancelled: isCancelled(studyright, 2),
      })

      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)
      const extentcode =
        educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id]
      const mappedStudyright = mapStudyright(studyright, {
        extentcode,
        prioritycode: parsePriorityCode(studyright),
        active: parseActivity(studyright, termRegistrations, extentcode),
        enddate: parseEndDate(studyright),
      })

      acc.push(mappedStudyright)
    }

    return acc
  }, [])

  await bulkCreate(Studyright, formattedStudyRights, null, ['studyrightid'])
  return formattedStudyRights
}

const updateStudyRightElements = async (
  groupedStudyRightSnapshots,
  moduleGroupIdToCode,
  personIdToStudentNumber,
  formattedStudyRights,
  mappedTransfers
) => {
  const mapStudyrightElements = (
    studyrightid,
    startdate,
    studentnumber,
    code,
    childCode,
    transfersByStudyRightId,
    formattedStudyRightsById
  ) => {
    const defaultProps = {
      studyrightid,
      startdate,
      studentnumber,
    }

    // be default, well use the enddate in studyright and given startdate
    // (might be horrible logic, check later)
    let { enddate } = formattedStudyRightsById[studyrightid]
    let realStartDate = startdate

    // except when studyright has been transferred, then override
    if (transfersByStudyRightId[studyrightid]) {
      const transfer = transfersByStudyRightId[studyrightid]
      if (code === transfer.sourcecode) {
        enddate = new Date(transfer.transferdate)
      } else if (code === transfer.targetcode) {
        realStartDate = new Date(transfer.transferdate)
      }
    }

    return [
      {
        ...defaultProps,
        id: `${defaultProps.studyrightid}-${code}`,
        code,
        enddate,
        startdate: realStartDate,
      },
      {
        ...defaultProps,
        id: `${defaultProps.studyrightid}-${childCode}`,
        code: childCode,
        enddate,
        startdate: realStartDate,
      },
    ]
  }

  const formattedStudyRightsById = {}
  Object.values(formattedStudyRights).forEach(studyright => {
    formattedStudyRightsById[studyright.studyrightid] = studyright
  })

  const transfersByStudyRightId = mappedTransfers.reduce((res, curr) => {
    res[curr.studyrightid] = curr
    return res
  }, {})

  const possibleBscFirst = s1 => {
    if (!s1.accepted_selection_path.educationPhase2GroupId) return -1
    return 1
  }

  const studyRightElements = Object.values(groupedStudyRightSnapshots)
    .reduce((res, snapshots) => {
      const mainStudyRight = snapshots[0]
      const mainStudyRightEducation = getEducation(mainStudyRight.education_id)
      if (!mainStudyRightEducation) {
        return res
      }

      const snapshotStudyRightElements = []
      const orderedSnapshots = orderBy(
        snapshots,
        [s => new Date(s.snapshot_date_time), s => Number(s.modification_ordinal)],
        ['desc', 'desc']
      )

      orderedSnapshots.sort(possibleBscFirst).forEach(snapshot => {
        const studentnumber = personIdToStudentNumber[mainStudyRight.person_id]
        // Previous implementation used the first snapshot date as the start date by default. This was meant to fix the bug for students that have transferred from one programme to another inside a faculty. However, this caused some problems for students that had previous studyrights (e.g. from open university) and then started their degree studies at the university. Now we use the first snapshot date as the start date only if there are multiple study right elements in one study right (i.e. the student has transferred from one programme to another) since the first snapshot date is the date when the transfer is happened. Otherwise we use the start date of the valid field of the snapshot. This might also fix the huge gaps that were caused by the previous implementation as the first snapshot date time doesn't always match with the actual start date of the studies.

        let startDate = snapshots.length > 1 ? snapshot.first_snapshot_date_time : snapshot.valid.startDate
        // The original fix was made for varhaiskasvatus at first place, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2741
        // However, there were gaps between other programmes too. Now ALL in all ba-ma studyrights master start date is bachelor graduation  date + 1
        if (
          snapshot.accepted_selection_path &&
          snapshot.accepted_selection_path.educationPhase2GroupId &&
          snapshot.study_right_graduation &&
          snapshot.study_right_graduation.phase1GraduationDate
        ) {
          const phase1GraduationDate = new Date(snapshot.study_right_graduation.phase1GraduationDate)
          startDate = phase1GraduationDate.setDate(phase1GraduationDate.getDate() + 1)
        }

        if (isBaMa(mainStudyRightEducation)) {
          const [baProgramme, baStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-1`,
            startDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId],
            transfersByStudyRightId,
            formattedStudyRightsById
          )
          const [maProgramme, maStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-2`,
            startDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2ChildGroupId],
            transfersByStudyRightId,
            formattedStudyRightsById
          )

          const possibleBScDuplicate = snapshotStudyRightElements.find(element => element.code === baProgramme.code)
          if (possibleBScDuplicate) {
            snapshotStudyRightElements.push(maProgramme, maStudytrack)
          } else {
            snapshotStudyRightElements.push(baProgramme, baStudytrack, maProgramme, maStudytrack)
          }
        } else {
          const [programme, studytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-1`, // mainStudyRight.id, duplikaattifix
            startDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId],
            transfersByStudyRightId,
            formattedStudyRightsById
          )
          snapshotStudyRightElements.push(programme, studytrack)
        }
      })

      res.push(...uniqBy(snapshotStudyRightElements, 'code'))
      return res
    }, [])
    .filter(sE => !!sE.code)

  await bulkCreate(StudyrightElement, studyRightElements)
}

// Parse possible values for programmes and studytracks based on phases the student has been accepted to.
// If elements aren't updated, db doesn't have right elementdetail codes and adding studyrightelements to db fails.
const updateElementDetails = async studyRights => {
  const groupedEducationPhases = studyRights.reduce(
    (acc, curr) => {
      const {
        accepted_selection_path: {
          educationPhase1GroupId,
          educationPhase1ChildGroupId,
          educationPhase2GroupId,
          educationPhase2ChildGroupId,
        },
      } = curr
      acc[20].add(educationPhase1GroupId)
      acc[20].add(educationPhase2GroupId)
      acc[30].add(educationPhase1ChildGroupId)
      acc[30].add(educationPhase2ChildGroupId)
      return acc
    },
    { 10: new Set(), 20: new Set(), 30: new Set() }
  )
  const programmes = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[20]].filter(a => !!a),
    'group_id'
  )
  // Find the educations instead of module if module information not there
  // add also the wanted information to programmes.
  // Note: the modules and educations are differs from each other. However, both entities contains
  // code, (programme) name and type that are necessary for the elementDetail table.
  const foundProgrammeGroupIds = programmes.map(prog => prog.group_id)
  if ([...new Set(foundProgrammeGroupIds)].length < [...groupedEducationPhases[20]].filter(a => !!a).length) {
    const programmeGroupIds = [...new Set(foundProgrammeGroupIds)]
    const notFoundGroupIds = [...groupedEducationPhases[20]]
      .filter(a => !!a)
      .filter(id => programmeGroupIds.includes(id))
    const educationIds = studyRights
      .filter(
        sr =>
          !notFoundGroupIds.includes(sr.accepted_selection_path.educationPhase1GroupId) &&
          !notFoundGroupIds.includes(sr.accepted_selection_path.educationPhase2GroupId)
      )
      .map(sr => sr.education_id)
    const educationInfo = await selectFromByIds('educations', educationIds)
    const mappedEducationInfo = educationInfo.map(education => {
      return { ...education, group_id: education.group_id.replace('EDU', 'DP'), type: 20 }
    })
    if (educationIds.length > 0) programmes.push(...mappedEducationInfo)
  }

  const studytracks = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[30]].filter(a => !!a),
    'group_id'
  )
  const mappedProgrammes = programmes.map(programme => ({ ...programme, type: 20 }))
  const mappedStudytracks = studytracks.map(studytrack => ({ ...studytrack, type: 30 }))

  // Sort to avoid deadlocks
  await bulkCreate(
    ElementDetail,
    sortedUniqBy(sortBy([...mappedProgrammes, ...mappedStudytracks], ['code']), e => e.code),
    null,
    ['code']
  )

  return [...mappedProgrammes, ...mappedStudytracks].reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})
}

module.exports = {
  updateStudyRights,
  updateStudyRightElements,
  updateElementDetails,
}
