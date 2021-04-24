// Module containing studyright-related updaters
const { educationTypeToExtentcode } = require('../shared')
const { mapStudyrightElements } = require('../mapper')
const { isBaMa } = require('../../utils') // Only used here, move
const { studyrightMapper } = require('../mapper') // also only used here
const { get, sortBy, sortedUniqBy, orderBy, uniqBy } = require('lodash')
const { ElementDetail, Studyright, StudyrightElement } = require('../../db/models')
const { selectFromByIds, bulkCreate } = require('../../db')
const { getDegrees, getEducation, getEducationType } = require('../shared') // not all of these are really shared,
// e.g. getDegrees, getEducationType is only used here, refactor?

const updateStudyRights = async (studyRights, personIdToStudentNumber, personIdToStudyRightIdToPrimality) => {
  const mapStudyright = studyrightMapper(personIdToStudentNumber)

  const parseCancelDate = (studyright, phase_number = 1, isBaMa = false) => {
    if (isBaMa && phase_number === 1 && get(studyright, 'study_right_graduation.phase1GraduationDate')) return null

    if (['RESCINDED','CANCELLED_BY_ADMINISTRATION'].includes(studyright.state)) return studyright.study_right_cancellation.cancellationDate
    if (studyright.state === 'PASSIVE') return studyright.snapshot_date_time
    return null
  }

  const parsePriorityCode = (studyright, phase_number = 1, isBaMa = false) => {
    const primality = get(personIdToStudyRightIdToPrimality, `${studyright.person_id}.${studyright.id}`)
    const primalityEndDate = get(primality, 'end_date')
    const isPrimality = primality && !primalityEndDate
    if (!isBaMa) {
      return studyright.state === 'GRADUATED' ? 30 : studyright.state === 'RESCINDED' ? 5 : isPrimality ? 1 : 2
    }
    if (phase_number === 1) {
      return get(studyright, 'study_right_graduation.phase1GraduationDate')
        ? 30
        : studyright.state === 'RESCINDED'
        ? 5
        : isPrimality
          ? 1
          : 2
    }
    return get(studyright, 'studyright.study_right_graduation.phase2GraduationDate')
      ? 30
      : studyright.state === 'RESCINDED'
        ? 5
        : isPrimality
          ? get(studyright, 'study_right_graduation.phase1GraduationDate')
            ? 1
            : 6
          : 2
  }

  const formattedStudyRights = studyRights.reduce((acc, studyright) => {
    const studyRightEducation = getEducation(studyright.education_id)
    if (!studyRightEducation) return acc

    if (isBaMa(studyRightEducation)) {
      const studyRightBach = mapStudyright(studyright, {
        extentcode: 1,
        studyrightid: `${studyright.id}-1`,
        prioritycode: parsePriorityCode(studyright, 1, true),
        canceldate: parseCancelDate(studyright, 1, true)
      })

      const studyRightMast = mapStudyright(studyright, {
        extentcode: 2,
        studyrightid: `${studyright.id}-2`,
        enddate:
          studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate
            ? studyright.study_right_graduation.phase2GraduationDate
            : studyright.valid.endDate,
        graduated: studyright.study_right_graduation && studyright.study_right_graduation.phase2GraduationDate ? 1 : 0,
        studystartdate: studyright.study_right_graduation
          ? studyright.study_right_graduation.phase1GraduationDate
          : null,
        prioritycode: parsePriorityCode(studyright, 2, true),
        canceldate: parseCancelDate(studyright, 2, true)
      })

      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)
      if (educationType.parent_id === 'urn:code:education-type:non-degree-education') {
        return acc
      }
      const mappedStudyright = mapStudyright(studyright, {
        extentcode: educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id],
        prioritycode: parsePriorityCode(studyright),
        canceldate: parseCancelDate(studyright)
      })

      acc.push(mappedStudyright)
    }

    return acc
  }, [])

  await bulkCreate(Studyright, formattedStudyRights, null, ['studyrightid'])
}

const updateStudyRightElements = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber) => {
  const possibleBscFirst = (s1, s2) => {
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
      const educationType = getEducationType(mainStudyRightEducation.education_type)
      if (educationType.parent_id === 'urn:code:education-type:non-degree-education') {
        return res
      }

      const snapshotStudyRightElements = []
      const orderedSnapshots = orderBy(snapshots, [s => new Date(s.snapshot_date_time), s =>  Number(s.modification_ordinal)], ['desc', 'desc'] )

      orderedSnapshots.sort(possibleBscFirst).forEach(snapshot => {
        const ordinal = snapshot.modification_ordinal
        const studentnumber = personIdToStudentNumber[mainStudyRight.person_id]

        // according to Eija Airio this is the right way to get the date... at least when studyright has changed
        let startDate = snapshot.first_snapshot_date_time

        // fix for varhaiskasvatus, see https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2741
        if ( snapshot.accepted_selection_path && snapshot.accepted_selection_path.educationPhase1GroupId ==='hy-DP-114256570' && snapshot.accepted_selection_path.educationPhase1ChildGroupId === 'otm-ebd2a5bb-190b-49cc-bccf-44c7e5eef14b') {
          if (orderedSnapshots.sort(possibleBscFirst)[0].state === 'PASSIVE') {
            startDate = snapshot.valid.startDate
          }
        }

        const endDate =
          snapshot.study_right_graduation && snapshot.study_right_graduation.phase1GraduationDate
            ? snapshot.study_right_graduation.phase1GraduationDate
            : snapshot.valid.endDate

        if (isBaMa(mainStudyRightEducation)) {
          const possibleBaDegrees = getDegrees(mainStudyRight.accepted_selection_path.educationPhase1GroupId)
          const [baDegree, baProgramme, baStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-1`,
            ordinal,
            startDate,
            endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId],
            possibleBaDegrees ? possibleBaDegrees[0].short_name.en : undefined
          )

          const possibleMaDegrees = getDegrees(mainStudyRight.accepted_selection_path.educationPhase2GroupId)
          const [maDegree, maProgramme, maStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-2`,
            ordinal,
            startDate,
            snapshot.study_right_graduation && snapshot.study_right_graduation.phase2GraduationDate
              ? snapshot.study_right_graduation.phase2GraduationDate
              : snapshot.valid.endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2ChildGroupId],
            possibleMaDegrees ? possibleMaDegrees[0].short_name.en : undefined 
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
            mainStudyRight.id,
            ordinal,
            startDate,
            endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase1ChildGroupId],
            possibleDegrees ? possibleDegrees[0].short_name.en : undefined
          )
          snapshotStudyRightElements.push(degree, programme, studytrack)
        }
      })

      res.push(...uniqBy(snapshotStudyRightElements, 'code'))
      return res
    }, [])
    .filter(sE => !!sE.code)

  const findMasterStudyRightBugs = (studyRightElements) => {
    const masterStudyRights = studyRightElements.filter(s => s.code.startsWith("MH"))

    // Check if newest snapshot is passive, but there is an active snapshot with newer
    // ordinal and later enddate
    // https://github.com/UniversityOfHelsinkiCS/oodikone/issues/2748
    const newestSnapShotHasAnomalie = (opinoikId) => {
      const snapshots = groupedStudyRightSnapshots[opinoikId]
      if (!snapshots || snapshots[0].state !== "PASSIVE") return false
      return snapshots.some(ss =>
          new Date(ss.valid.endDate) > new Date(snapshots[0].valid.endDate &&
          ss.modification_ordinal > snapshots[0].modification_ordinal)
      )
    }

    const studyrightsWithAnomalies = masterStudyRights.filter(sr =>
      newestSnapShotHasAnomalie(sr.studyrightid.slice(0, -2))
    )
    if (studyrightsWithAnomalies.length > 0) {
      console.log("Students whose correct enddate is skipped because of newer snapshot:")
      studyrightsWithAnomalies.forEach(sr =>
        console.log(sr.studentnumber, "- program:", sr.code)
      )
    }
  }
  // Uncomment following to find different types of msc studyright bugs
  // findMasterStudyRightBugs(studyRightElements)

  await bulkCreate(StudyrightElement, studyRightElements)
}

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

// Parse possible values for degrees, programmes and studytracks based on phases the student has been accepted to.
// If elements aren't updated, db doesn't have right elementdetail codes and adding studyrightelements to db fails.
const updateElementDetails = async studyRights => {
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
