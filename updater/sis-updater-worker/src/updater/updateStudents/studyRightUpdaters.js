const { educationTypeToExtentcode } = require('../shared')
const { isBaMa } = require('../../utils')
const { get, sortBy, sortedUniqBy, orderBy, uniqBy, has } = require('lodash')
const { ElementDetail, Studyright, StudyrightElement } = require('../../db/models')
const { selectFromByIds, bulkCreate } = require('../../db')
const { getDegrees, getEducation, getEducationType, getOrganisationCode } = require('../shared')

const updateStudyRights = async (studyRights, personIdToStudentNumber, personIdToStudyRightIdToPrimality) => {

  const studyrightMapper = personIdToStudentNumber => (studyright, overrideProps) => {
    const defaultProps = {
      studyrightid: `${studyright.id}-1`, // duplikaattifix
      facultyCode: getOrganisationCode(studyright.organisation_id),
      startdate: studyright.valid.startDate,
      givendate: studyright.grant_date,
      studentStudentnumber: personIdToStudentNumber[studyright.person_id],
      graduated: studyright.study_right_graduation ? 1 : 0,
      studystartdate: studyright.valid.startDate, 
    }
    return {
      ...defaultProps,
      ...overrideProps,
    }
  }

  const parseCancelDate = (studyright, phase_number = 1, isBaMa = false) => {
    // is this really needed?
    if (isBaMa && phase_number === 1 && get(studyright, 'study_right_graduation.phase1GraduationDate')) return null

    if (['RESCINDED','CANCELLED_BY_ADMINISTRATION'].includes(studyright.state)) return studyright.study_right_cancellation.cancellationDate
    if (studyright.state === 'PASSIVE') return studyright.snapshot_date_time
    return null
  }

  const parseEndDate = (studyright, phase_number = 1, isBaMa = false) => {

    // Set eternal studyright enddate to match what we used to use in oodi-oodikone
    // instead of showing it as "Unavailable" in frontend
    const isEternalStudyRight = studyright => studyright
        && studyright.study_right_expiration_rules_urn
        && studyright.study_right_expiration_rules_urn.includes("urn:code:study-right-expiration-rules:eternal")
  
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
      RESCINDED: 5,
      GRADUATED: 30,
      OPTION: 6
    }
  
    // Logic still a bit repetitive, plz make this better!
    if (!isBaMa) {
      if (studyright.state === 'GRADUATED') return PRIORITYCODES.GRADUATED
      if (studyright.state === 'RESCINDED') return PRIORITYCODES.RESCINDED
      return isPrimality ? PRIORITYCODES.MAIN : PRIORITYCODES.SECONDARY
    }

    if (phase_number === 1) {
      if (get(studyright, 'study_right_graduation.phase1GraduationDate')) return PRIORITYCODES.GRADUATED
      if (studyright.state === 'RESCINDED') return PRIORITYCODES.RESCINDED
      return isPrimality ? PRIORITYCODES.MAIN : PRIORITYCODES.SECONDARY
    }

    if (get(studyright, 'studyright.study_right_graduation.phase2GraduationDate')) {
      return PRIORITYCODES.GRADUATED
    }

    if (studyright.state === 'RESCINDED') return PRIORITYCODES.RESCINDED

    if (isPrimality) {
      return get(studyright, 'study_right_graduation.phase1GraduationDate')
            ? PRIORITYCODES.MAIN
            : PRIORITYCODES.OPTION
    }
    return PRIORITYCODES.SECONDARY
  }

  const mapStudyright = studyrightMapper(personIdToStudentNumber)

  const formattedStudyRights = studyRights.reduce((acc, studyright) => {
    const studyRightEducation = getEducation(studyright.education_id)
    if (!studyRightEducation) return acc


    if (isBaMa(studyRightEducation)) {
      const studyRightBach = mapStudyright(studyright, {
        extentcode: 1,
        prioritycode: parsePriorityCode(studyright, 1, true),
        canceldate: parseCancelDate(studyright, 1, true),
        enddate: parseEndDate(studyright, 1, true),
      })

      const studyRightMast = mapStudyright(studyright, {
        extentcode: 2,
        prioritycode: parsePriorityCode(studyright, 2, true),
        canceldate: parseCancelDate(studyright, 2, true),
        enddate: parseEndDate(studyright, 2, true),
        studyrightid: `${studyright.id}-2`,
        graduated: studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate ? 1 : 0,
        studystartdate: studyright.study_right_graduation
          ? studyright.study_right_graduation.phase1GraduationDate
          : null,
      })

      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)

      const mappedStudyright = mapStudyright(studyright, {
        extentcode: educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id],
        prioritycode: parsePriorityCode(studyright),
        canceldate: parseCancelDate(studyright),
        enddate: parseEndDate(studyright),
      })

      acc.push(mappedStudyright)
    }

    return acc
  }, [])

  await bulkCreate(Studyright, formattedStudyRights, null, ['studyrightid'])
  return formattedStudyRights
}

const mapStudyrightElements = (studyrightid, startdate, studentnumber, code, childCode, degreeCode, transfersByStudyRightId, formattedStudyRightsById) => {
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
      enddate.setDate(enddate.getDate() - 1)
    } else if (code === transfer.targetcode) {
      startdate = transfer.transferdate
    }
  }


  // we should probably map degree in a different manner since degree can be per many
  // programmes and studytracks. Now the correct one might be overwritten later.
  return [
    {
    ...defaultProps,
    id: `${defaultProps.studyrightid}-${degreeCode}`,
    code: degreeCode,
    enddate,
    },
    {
      ...defaultProps,
      id: `${defaultProps.studyrightid}-${code}`,
      code,
      enddate,
      startdate: realStartDate
    },
    {
      ...defaultProps,
      id: `${defaultProps.studyrightid}-${childCode}`,
      code: childCode,
      enddate,
      startdate: realStartDate
    },
  ]
}

const updateStudyRightElements = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber, formattedStudyRights) => {

  const formattedStudyRightsById = {}
  Object.values(formattedStudyRights).forEach(studyright => {
    formattedStudyRightsById[studyright.studyrightid] = studyright
  })

  const possibleBscFirst = (s1, s2) => {
    if (!s1.accepted_selection_path.educationPhase2GroupId) return -1
    return 1
  }

  const getTransfersFrom = (orderedSnapshots, studyrightid, educationId) => {
    return orderedSnapshots.reduce((curr, snapshot, i) => {
      if (i === 0) return curr

      const studyRightEducation = getEducation(educationId)
      if (!studyRightEducation) return curr

      const usePhase2 =
        isBaMa(studyRightEducation) && !!get(orderedSnapshots[i - 1], 'study_right_graduation.phase1GraduationDate')

      if (usePhase2 && !get(orderedSnapshots[i - 1], 'accepted_selection_path.educationPhase2GroupId')) return curr

      const mappedId = isBaMa(studyRightEducation)
        ? usePhase2 && !!get(snapshot, 'accepted_selection_path.educationPhase2GroupId')
          ? `${studyrightid}-2`
          : `${studyrightid}-1`
        : `${studyrightid}-1` // studyrightid duplicatefix

      const sourcecode =
        moduleGroupIdToCode[
          orderedSnapshots[i - 1].accepted_selection_path[
            usePhase2 ? 'educationPhase2GroupId' : 'educationPhase1GroupId'
          ]
        ]

      const targetcode =
        moduleGroupIdToCode[
          snapshot.accepted_selection_path[
            usePhase2 && has(snapshot, 'accepted_selection_path.educationPhase2GroupId')
              ? 'educationPhase2GroupId'
              : 'educationPhase1GroupId'
          ]
        ]

      if (!sourcecode || !targetcode || sourcecode === targetcode) return curr
      // source === targetcode isn't really a change between programmes, but we should still update transferdate to
      // newer snapshot date time
      // but: updating requires some changes to this reducers logic, so this fix can be here for now

      curr.push({
        id: `${mappedId}-${snapshot.modification_ordinal}-${sourcecode}-${targetcode}`,
        sourcecode,
        targetcode,
        transferdate: new Date(snapshot.snapshot_date_time),
        studentnumber: personIdToStudentNumber[snapshot.person_id],
        studyrightid: mappedId
      })

      return curr
    }, [])
  }

  const transfersByStudyRightId = {}
  Object.values(groupedStudyRightSnapshots).forEach(snapshots => {
    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')
    getTransfersFrom(orderedSnapshots, snapshots[0].id, snapshots[0].education_id).forEach(
      transfer => {
        transfersByStudyRightId[transfer.studyrightid] = transfer
      })
  })

  const studyRightElements = Object.values(groupedStudyRightSnapshots)
    .reduce((res, snapshots) => {
      const mainStudyRight = snapshots[0]
      const mainStudyRightEducation = getEducation(mainStudyRight.education_id)
      if (!mainStudyRightEducation) {
        return res
      }

      const snapshotStudyRightElements = []
      const orderedSnapshots = orderBy(snapshots, [s => new Date(s.snapshot_date_time), s =>  Number(s.modification_ordinal)], ['desc', 'desc'] )

      orderedSnapshots.sort(possibleBscFirst).forEach(snapshot => {
        const studentnumber = personIdToStudentNumber[mainStudyRight.person_id]

        // according to Eija Airio this is the right way to get the date... at least when studyright has changed
        let startDate = snapshot.first_snapshot_date_time

        // fix for varhaiskasvatus, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2741
        if ( snapshot.accepted_selection_path && snapshot.accepted_selection_path.educationPhase1GroupId ==='hy-DP-114256570' && snapshot.accepted_selection_path.educationPhase1ChildGroupId === 'otm-ebd2a5bb-190b-49cc-bccf-44c7e5eef14b') {
          if (orderedSnapshots.sort(possibleBscFirst)[0].state === 'PASSIVE') {
            startDate = snapshot.valid.startDate
          }
        }

        if (isBaMa(mainStudyRightEducation)) {
          const possibleBaDegrees = getDegrees(mainStudyRight.accepted_selection_path.educationPhase1GroupId)
          const [baDegree, baProgramme, baStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-1`,
            startDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId],
            possibleBaDegrees ? possibleBaDegrees[0].short_name.en : undefined,
            transfersByStudyRightId,
            formattedStudyRightsById
          )

          const possibleMaDegrees = getDegrees(mainStudyRight.accepted_selection_path.educationPhase2GroupId)
          const [maDegree, maProgramme, maStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-2`,
            startDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2ChildGroupId],
            possibleMaDegrees ? possibleMaDegrees[0].short_name.en : undefined ,
            transfersByStudyRightId,
            formattedStudyRightsById
          )

          const possibleBScDuplicate = snapshotStudyRightElements.find(element => element.code === baProgramme.code)
          if (possibleBScDuplicate) {
            snapshotStudyRightElements.push(maDegree, maProgramme, maStudytrack)
          } else {
            snapshotStudyRightElements.push(baDegree, baProgramme, baStudytrack, maDegree, maProgramme, maStudytrack)
          }

        } else {
          const possibleDegrees = getDegrees(mainStudyRight.accepted_selection_path.educationPhase1GroupId)
          const [degree, programme, studytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-1`, //mainStudyRight.id, duplikaattiifx
            startDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId],
            possibleDegrees ? possibleDegrees[0].short_name.en : undefined,
            transfersByStudyRightId,
            formattedStudyRightsById
          )
          snapshotStudyRightElements.push(degree, programme, studytrack)
        }
      })


      res.push(...uniqBy(snapshotStudyRightElements, 'code'))
      return res
    }, [])
    .filter(sE => !!sE.code)

  await bulkCreate(StudyrightElement, studyRightElements)
}

// Parse possible values for degrees, programmes and studytracks based on phases the student has been accepted to.
// If elements aren't updated, db doesn't have right elementdetail codes and adding studyrightelements to db fails.
const updateElementDetails = async studyRights => {
  // Create degree object to be added to db as element detail
  const createDegreeFromGroupId = groupdId => {
    const degrees = getDegrees(groupdId)
    if (!degrees) return
    const degree = degrees[0]
    return {
      group_id: `${groupdId}-degree`,
      code: degree.short_name.en,
      name: degree.name
    }
  }
  const groupedEducationPhases = studyRights.reduce(
    (acc, curr) => {
      const {
        accepted_selection_path: {
          educationPhase1GroupId,
          educationPhase1ChildGroupId,
          educationPhase2GroupId,
          educationPhase2ChildGroupId
        }
      } = curr
      // Degree fetching is done only if educationPhase is present. Not the best logic, should be fixed.
      if (educationPhase1GroupId) {
        acc[10].add(createDegreeFromGroupId(educationPhase1GroupId))
      }
      if (educationPhase2GroupId) {
        acc[10].add(createDegreeFromGroupId(educationPhase2GroupId))
      }
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
  const studytracks = await selectFromByIds(
    'modules',
    [...groupedEducationPhases[30]].filter(a => !!a),
    'group_id'
  )

  const mappedDegrees = [...groupedEducationPhases[10]].filter(degree => degree).map(degree => ({
    ...degree,
    type: 10
  }))
  const mappedProgrammes = programmes.map(programme => ({ ...programme, type: 20 }))
  const mappedStudytracks = studytracks.map(studytrack => ({ ...studytrack, type: 30 }))

  // Sort to avoid deadlocks
  await bulkCreate(
    ElementDetail,
    sortedUniqBy(sortBy([...mappedDegrees, ...mappedProgrammes, ...mappedStudytracks], ['code']), e => e.code),
    null,
    ['code']
  )

  return [...mappedDegrees, ...mappedProgrammes, ...mappedStudytracks].reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})
}

module.exports = {
  updateStudyRights,
  updateStudyRightElements,
  updateElementDetails
}
