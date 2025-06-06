import { flatten, groupBy, orderBy } from 'lodash-es'
import { Op } from 'sequelize'

import { bulkCreate, selectFromActiveSnapshotsByIds, selectFromByIds } from '../../db/index.js'
import { Course, Enrollment, Student } from '../../db/models/index.js'
import logger from '../../utils/logger.js'
import { studentMapper, enrollmentMapper } from '../mapper.js'
import { getEducation, loadMapsIfNeeded } from '../shared.js'
import { updateAttainments } from './attainments.js'
import { getAttainmentsToBeExcluded } from './excludedPartialAttainments.js'
import { updateSISStudyRights, updateSISStudyRightElements } from './SISStudyRights.js'
import { updateStudyplans, findStudentsToReupdate } from './studyPlans.js'

// Accepted selection path is not available when degree programme doesn't have
// studytrack or major subject. This is a known bug on SIS and has been reported
// to funidata.
// In these cases, degree programmes module group id must be fetched from education.
const addSelectionPathIfNeeded = snapshot => {
  if (Object.keys(snapshot.accepted_selection_path).length > 0) return snapshot

  const correctModuleGroupId = getEducation(snapshot.education_id)?.structure.phase1.options[0].moduleGroupId
  if (!correctModuleGroupId) return null

  return {
    ...snapshot,
    accepted_selection_path: { educationPhase1GroupId: correctModuleGroupId },
  }
}

// Parse useful snapshots from the whole list and enrich snapshots when needed
const parseStudyrightSnapshots = studyrightSnapshots =>
  studyrightSnapshots.reduce((parsed, current) => {
    if (current.document_state !== 'ACTIVE') return parsed
    const snapshotWithSelectionPath = addSelectionPathIfNeeded(current)
    if (snapshotWithSelectionPath) parsed.push(snapshotWithSelectionPath)
    return parsed
  }, [])

// Group snapshots by studyright id and find out when studyrights have begun
const groupStudyrightSnapshots = studyrightSnapshots => {
  const snapshotsBystudyright = Object.entries(groupBy(studyrightSnapshots, 'id'))

  return snapshotsBystudyright.reduce((res, [id, snapshots]) => {
    const byPhases = s => {
      const phase1 = s.accepted_selection_path.educationPhase1GroupId
      const phase2 = s.accepted_selection_path.educationPhase2GroupId
        ? s.accepted_selection_path.educationPhase2GroupId
        : 'none'
      return `${phase1}-${phase2}`
    }

    const orderedSnapshots = orderBy(
      snapshots,
      [s => new Date(s.snapshot_date_time), s => Number(s.modification_ordinal)],
      ['desc', 'desc']
    )

    const groupedByPhases = groupBy(orderedSnapshots, byPhases)

    // Get snapshot date time from oldest snapshot where date time is available. If no date
    // times are available (e.g. all are null), take study start date of the oldest one
    const parseSnapshotDateTime = snapshots => {
      const oldestFirst = snapshots
        .filter(s => !!s.snapshot_date_time)
        .sort((a, b) => new Date(a.snapshot_date_time) - new Date(b.snapshot_date_time))
      if (oldestFirst.length) return oldestFirst[0].snapshot_date_time
      return null
    }

    const snapshotsWithRightDate = Object.keys(groupedByPhases).map(key => {
      const snapshots = groupedByPhases[key]
      const most_recent = snapshots[0]
      most_recent.first_snapshot_date_time = parseSnapshotDateTime(snapshots)
      return most_recent
    })

    res[id] = snapshotsWithRightDate

    return res
  }, {})
}

// Group snapshots by studyright id and order them so that the latest snapshot is the first element in the array
const groupSISStudyRightSnapshots = studyrightSnapshots => {
  const activeSnapshots = studyrightSnapshots.filter(s => s.document_state === 'ACTIVE')
  const snapshotsByStudyRight = Object.entries(groupBy(activeSnapshots, 'id'))

  return snapshotsByStudyRight.reduce((res, [studyRightId, snapshots]) => {
    const orderedSnapshots = orderBy(
      snapshots,
      [s => new Date(s.snapshot_date_time), s => Number(s.modification_ordinal)],
      ['desc', 'desc']
    )
    res[studyRightId] = orderedSnapshots
    return res
  }, {})
}

const updateEnrollments = async (enrollments, personIdToStudentNumber, studyRightIdToEducationType) => {
  // Other states are ABORTED_BY_STUDENT, ABORTED_BY_TEACHER, INVALID, NOT_ENROLLED, AND PROCESSING but we're only interested in ENROLLED and REJECTED
  const validEnrollments = enrollments.filter(
    ({ state, document_state }) => document_state === 'ACTIVE' && ['ENROLLED', 'REJECTED'].includes(state)
  )
  const [courseUnitRealisations, courseUnits] = await Promise.all([
    selectFromByIds(
      'course_unit_realisations',
      validEnrollments.map(({ course_unit_realisation_id }) => course_unit_realisation_id).filter(id => !!id)
    ),
    selectFromByIds(
      'course_units',
      validEnrollments.map(({ course_unit_id }) => course_unit_id).filter(id => !!id)
    ),
  ])

  const realisationIdToActivityPeriod = courseUnitRealisations.reduce((res, cur) => {
    res[cur.id] = cur.activity_period
    return res
  }, {})

  const courseUnitIdToCourseGroupId = courseUnits.reduce((res, curr) => {
    res[curr.id] = curr.group_id
    return res
  }, {})

  const sisDbCoursesForStudentAttainments = await Course.findAll({
    where: {
      id: {
        [Op.in]: Object.values(courseUnitIdToCourseGroupId),
      },
    },
  })
  const courseGroupIdToCourseCode = sisDbCoursesForStudentAttainments.reduce((res, curr) => {
    res[curr.id] = curr.code
    return res
  }, {})

  const mapEnrollment = enrollmentMapper(
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    realisationIdToActivityPeriod,
    courseGroupIdToCourseCode,
    studyRightIdToEducationType
  )

  const mappedEnrollments = validEnrollments.map(mapEnrollment).filter(({ studentnumber }) => studentnumber != null)
  await bulkCreate(Enrollment, mappedEnrollments)
}

const createModuleGroupIdToCodeMap = async studyRights => {
  const groupIds = new Set()

  for (const { accepted_selection_path } of studyRights) {
    const { educationPhase1GroupId, educationPhase1ChildGroupId, educationPhase2GroupId, educationPhase2ChildGroupId } =
      accepted_selection_path
    groupIds.add(educationPhase1GroupId)
    groupIds.add(educationPhase2GroupId)
    groupIds.add(educationPhase1ChildGroupId)
    groupIds.add(educationPhase2ChildGroupId)
  }

  const programmesAndStudyTracks = await selectFromByIds(
    'modules',
    [...groupIds].filter(a => !!a),
    'group_id'
  )

  return programmesAndStudyTracks.reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})
}

export const updateStudents = async (personIds, iteration = 0) => {
  await loadMapsIfNeeded()

  const [students, studyrightSnapshots, attainments, termRegistrations, enrollments, studyplans] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id'),
    selectFromByIds('enrolments', personIds, 'person_id'),
    selectFromByIds('plans', personIds, 'user_id'),
  ])

  const enrollmentStudyrights = await selectFromActiveSnapshotsByIds(
    'studyrights',
    enrollments.map(({ study_right_id }) => study_right_id).filter(id => !!id)
  )
  const attainmentStudyrights = await selectFromActiveSnapshotsByIds(
    'studyrights',
    attainments.map(a => a.study_right_id).filter(id => !!id)
  )

  const bothStudyrights = [...enrollmentStudyrights, ...attainmentStudyrights]

  const parsedStudyrightSnapshots = parseStudyrightSnapshots(studyrightSnapshots)
  const groupedStudyRightSnapshots = groupStudyrightSnapshots(parsedStudyrightSnapshots)
  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const attainmentsToBeExluced = getAttainmentsToBeExcluded()
  const mappedStudents = students
    .filter(s => s.student_number)
    .map(studentMapper(attainments, parsedStudyrightSnapshots, attainmentsToBeExluced))

  await bulkCreate(Student, mappedStudents)

  const groupedSISStudyRightSnapshots = groupSISStudyRightSnapshots(studyrightSnapshots)

  const moduleGroupIdToCode = await createModuleGroupIdToCodeMap(flatten(Object.values(groupedSISStudyRightSnapshots)))

  const createdStudyRights = await updateSISStudyRights(
    groupedSISStudyRightSnapshots,
    personIdToStudentNumber,
    termRegistrations
  )

  await updateSISStudyRightElements(
    Object.values(groupedSISStudyRightSnapshots),
    moduleGroupIdToCode,
    createdStudyRights
  )

  const educations = await selectFromByIds(
    'educations',
    bothStudyrights.map(({ education_id }) => education_id).filter(id => !!id)
  )

  const studyRightIdToEducationType = bothStudyrights.reduce((res, curr) => {
    const education = educations.find(education => education.id === curr.education_id)
    res[curr.id] = education ? education.education_type : null
    return res
  }, {})

  const logError = (error, updatedItem) => {
    logger.error({ message: `Failed to update ${updatedItem}`, error })
  }

  await Promise.all([
    updateAttainments(attainments, personIdToStudentNumber, attainmentsToBeExluced, studyRightIdToEducationType).catch(
      error => {
        logError(error, 'attainments')
      }
    ),
    updateEnrollments(enrollments, personIdToStudentNumber, studyRightIdToEducationType).catch(error => {
      logError(error, 'enrollments')
    }),
    updateStudyplans(studyplans, personIds, personIdToStudentNumber, groupedStudyRightSnapshots).catch(error => {
      logError(error, 'studyplans')
    }),
  ])

  // Studyplans do not always update. These launch updateStudents again for those
  // whose studyplans weren't updated. Twice to see if it sometimes misses
  const studentsToReupdate = await findStudentsToReupdate(personIds, personIdToStudentNumber, iteration)
  if (!studentsToReupdate) return
  if (studentsToReupdate.length) {
    logger.info(`Updating ${studentsToReupdate.length} students again due to studyplans not updating.`)
    await updateStudents(studentsToReupdate, iteration + 1)
  }
}
