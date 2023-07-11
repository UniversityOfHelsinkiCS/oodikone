const { educationTypeToExtentcode } = require('../shared')
const { isBaMa } = require('../../utils')
const { get, sortBy, sortedUniqBy, orderBy, uniqBy, flatMap } = require('lodash')
const { ElementDetail, Studyright, StudyrightElement } = require('../../db/models')
const { selectFromByIds, bulkCreate, selectAllFrom } = require('../../db')
const {
  getEducation,
  getEducationType,
  getOrganisationCode,
  getUniOrgId,
  getSemester,
  getSemesterByDate,
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
      facultyCode: getOrganisationCode(studyright.organisation_id),
      startdate: studyright.valid.startDate,
      givendate: studyright.grant_date,
      studentStudentnumber: personIdToStudentNumber[studyright.person_id],
      graduated: studyright.study_right_graduation ? 1 : 0,
      studystartdate: studyright.valid.startDate,
      admissionType: admissionNamesById[studyright.admission_type_urn],
      cancelled,
    }
    return {
      ...defaultProps,
      ...overrideProps,
    }
  }

  const parseActivity = (studyright, termRegistrations) => {
    // These are the states which indicate that the study right has been cancelled by student or administration, thus studyright is not active
    // NOT_STARTED means that study right starts in the future.
    if (
      studyright.study_right_cancellation &&
      ['RESCINDED', 'CANCELLED_BY_ADMINISTRATION', 'PASSIVE', 'NOT_STARTED', 'EXPIRED'].includes(
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
        active: parseActivity(studyright, termRegistrations),
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
        active: parseActivity(studyright, termRegistrations),
        enddate: parseEndDate(studyright, 2, true),
        studyrightid: `${studyright.id}-2`,
        graduated: studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate ? 1 : 0,
        studystartdate: studyStartDate,
        cancelled: isCancelled(studyright, 2),
      })

      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)
      const mappedStudyright = mapStudyright(studyright, {
        extentcode: educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id],
        prioritycode: parsePriorityCode(studyright),
        active: parseActivity(studyright, termRegistrations),
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
    let enddate = formattedStudyRightsById[studyrightid].enddate
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
        // according to Eija Airio this is the right way to get the date... at least when studyright has changed
        // clarification: when education changes in the study right we need to get the start date from
        // the _first_ snapshot as it is the date when the transfer is happened. However, this causes sometimes huge caps
        let startDate = snapshot.first_snapshot_date_time || snapshot.valid.startDate
        // fix was made for varhaiskasvatus at first place, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2741
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
            `${mainStudyRight.id}-1`, //mainStudyRight.id, duplikaattifix
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
