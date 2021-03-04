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

  const cancelDate = (studyright, phase_number = 1, isBaMa = false) => {
    if (isBaMa && phase_number === 1 && get(studyright, 'study_right_graduation.phase1GraduationDate')) return null
    if (studyright.state === 'RESCINDED') return studyright.study_right_cancellation.cancellationDate
    if (studyright.state === 'PASSIVE') return studyright.snapshot_date_time
    return null
  }

  const priorityCode = (studyright, phase_number = 1, isBaMa = false) => {
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
        prioritycode: priorityCode(studyright, 1, true),
        canceldate: cancelDate(studyright, 1, true)
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
        prioritycode: priorityCode(studyright, 2, true),
        canceldate: cancelDate(studyright, 2, true)
      })


      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)
      if (educationType.parent_id === 'urn:code:education-type:non-degree-education') {
        return acc
      }
      const mappedStudyright = mapStudyright(studyright, {
        extentcode: educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id],
        prioritycode: priorityCode(studyright),
        canceldate: cancelDate(studyright)
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
      const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')

      orderedSnapshots.sort(possibleBscFirst).forEach(snapshot => {
        const ordinal = snapshot.modification_ordinal
        const studentnumber = personIdToStudentNumber[mainStudyRight.person_id]

        //const startDate = snapshot.valid.startDate
        // according to Eija Airio this is the right way to get the date... at least when studyright has changed
        const startDate = snapshot.first_snapshot_date_time

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
            possibleBaDegrees ? possibleBaDegrees[0].short_name.en : null
          )

          const possibleMaDegrees = getDegrees(mainStudyRight.accepted_selection_path.educationPhase2GroupId)
          const [maDegree, maProgramme, maStudytrack] = mapStudyrightElements(
            `${mainStudyRight.id}-2`,
            ordinal,
            //snapshot.study_right_graduation ? snapshot.study_right_graduation.phase1GraduationDate : null,
            startDate,
            snapshot.study_right_graduation && snapshot.study_right_graduation.phase2GraduationDate
              ? snapshot.study_right_graduation.phase2GraduationDate
              : snapshot.valid.endDate,
            studentnumber,
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2GroupId],
            moduleGroupIdToCode[snapshot.accepted_selection_path.educationPhase2ChildGroupId],
            possibleMaDegrees ? possibleMaDegrees[0].short_name.en : null
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
            possibleDegrees ? possibleDegrees[0].short_name.en : null
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