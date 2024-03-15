const { Op } = require('sequelize')
const { flatten, groupBy, orderBy, has, get, uniq } = require('lodash')

const { Course, Student, SemesterEnrollment, Transfer, Enrollment } = require('../../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate, selectFromActiveSnapshotsByIds } = require('../../db')
const { getEducation, getUniOrgId, loadMapsIfNeeded } = require('../shared')
const { studentMapper, semesterEnrollmentMapper, enrollmentMapper } = require('../mapper')
const { isBaMa } = require('../../utils')
const { updateStudyRights, updateStudyRightElements, updateElementDetails } = require('./studyRightUpdaters')
const { getAttainmentsToBeExcluded } = require('./excludedPartialAttainments')
const { updateAttainments } = require('./attainments')
const { updateStudyplans, findStudentsToReupdate } = require('./studyPlans')
const { logger } = require('../../utils/logger')

// Accepted selection path is not available when degree programme doesn't have
// studytrack or major subject. This is a known bug on SIS and has been reported
// to funidata.
// In these cases, degree programmes module group id must be fetched from education.
const addSelectionPathIfNeeded = snapshot =>
  Object.keys(snapshot.accepted_selection_path).length === 0
    ? {
        ...snapshot,
        accepted_selection_path: {
          educationPhase1GroupId: getEducation(snapshot.education_id).structure.phase1.options[0].moduleGroupId,
        },
      }
    : snapshot

// Parse useful snapshots from the whole list and enrich snapshots when needed
const parseStudyrightSnapshots = studyrightSnapshots =>
  studyrightSnapshots.reduce((parsed, current) => {
    if (current.document_state !== 'ACTIVE') return parsed
    parsed.push(addSelectionPathIfNeeded(current))
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

const parseTransfers = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber) => {
  const getTransfersFrom = (orderedSnapshots, studyrightid, educationId) => {
    return orderedSnapshots.reduce((curr, snapshot, i) => {
      if (i === 0) return curr

      const studyRightEducation = getEducation(educationId)
      if (!studyRightEducation) return curr

      const usePhase2 =
        isBaMa(studyRightEducation) && !!get(orderedSnapshots[i - 1], 'study_right_graduation.phase1GraduationDate')

      if (usePhase2 && !get(orderedSnapshots[i - 1], 'accepted_selection_path.educationPhase2GroupId')) return curr

      let mappedId

      if (isBaMa(studyRightEducation)) {
        if (usePhase2 && !!get(snapshot, 'accepted_selection_path.educationPhase2GroupId')) {
          mappedId = `${studyrightid}-2`
        } else {
          mappedId = `${studyrightid}-1`
        }
      } else {
        mappedId = `${studyrightid}-1` // studyrightid duplicatefix
      }

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
        transferdate: new Date(snapshot.first_snapshot_date_time || snapshot.snapshot_date_time),
        studentnumber: personIdToStudentNumber[snapshot.person_id],
        studyrightid: mappedId,
      })

      return curr
    }, [])
  }

  const transfers = []
  Object.values(groupedStudyRightSnapshots).forEach(snapshots => {
    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')
    transfers.push(...getTransfersFrom(orderedSnapshots, snapshots[0].id, snapshots[0].education_id))
  })
  return transfers
}

const updateEnrollments = async (enrollments, personIdToStudentNumber, studyRightIdToEducationType) => {
  const [courseUnitRealisations, courseUnits] = await Promise.all([
    selectFromByIds(
      'course_unit_realisations',
      enrollments.map(({ course_unit_realisation_id }) => course_unit_realisation_id).filter(id => !!id)
    ),
    selectFromByIds(
      'course_units',
      enrollments.map(({ course_unit_id }) => course_unit_id).filter(id => !!id)
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

  const mappedEnrollments = enrollments
    .filter(({ document_state }) => document_state === 'ACTIVE')
    .map(mapEnrollment)
    .filter(({ studentnumber }) => studentnumber != null)
  await bulkCreate(Enrollment, mappedEnrollments)
}

// why we are using two terms for the same thing: term registration and semester enrollment
const semesterEnrolmentsOfStudent = allSemesterEnrollments => {
  const semesters = uniq(allSemesterEnrollments.map(s => s.semestercode))
  const semesterEnrollments = semesters.map(semester => {
    const enrollmentsForSemester = allSemesterEnrollments.filter(se => se.semestercode === semester)

    const present = enrollmentsForSemester.find(se => se.enrollmenttype === 1)
    if (present) {
      return present
    }
    const absent = enrollmentsForSemester.find(se => se.enrollmenttype === 2)
    if (absent) {
      return absent
    }

    return enrollmentsForSemester[0]
  })

  return semesterEnrollments
}

const updateTermRegistrations = async (termRegistrations, personIdToStudentNumber) => {
  const studyRightIds = termRegistrations.map(({ study_right_id }) => study_right_id)
  const studyRights = await selectFromSnapshotsByIds('studyrights', studyRightIds)

  const studyrightToUniOrgId = studyRights.reduce((res, curr) => {
    res[curr.id] = getUniOrgId(curr.organisation_id)
    return res
  }, {})

  const mapSemesterEnrollment = semesterEnrollmentMapper(personIdToStudentNumber, studyrightToUniOrgId)

  const allSementerEnrollments = flatten(
    termRegistrations
      .filter(t => t.student_id !== null && studyRights.some(r => r.id === t.study_right_id))
      .map(({ student_id, term_registrations, study_right_id }) =>
        term_registrations.map(mapSemesterEnrollment(student_id, study_right_id))
      )
  )

  const enrolmentsByStudents = groupBy(allSementerEnrollments, e => e.studentnumber)
  const semesterEnrollments = flatten(Object.values(enrolmentsByStudents).map(semesterEnrolmentsOfStudent))

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

const updateStudents = async (personIds, iteration = 0) => {
  await loadMapsIfNeeded()

  const [
    students,
    studyrightSnapshots,
    attainments,
    termRegistrations,
    studyRightPrimalities,
    enrollments,
    studyplans,
  ] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id'),
    selectFromByIds('study_right_primalities', personIds, 'student_id'),
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

  const personIdToStudyRightIdToPrimality = studyRightPrimalities.reduce((res, curr) => {
    if (!res[curr.student_id]) res[curr.student_id] = {}
    res[curr.student_id][curr.study_right_id] = curr
    return res
  }, {})

  const attainmentsToBeExluced = getAttainmentsToBeExcluded()
  const mappedStudents = students
    .filter(s => s.student_number)
    .map(studentMapper(attainments, parsedStudyrightSnapshots, attainmentsToBeExluced))

  await bulkCreate(Student, mappedStudents)

  const [moduleGroupIdToCode, formattedStudyRights] = await Promise.all([
    updateElementDetails(flatten(Object.values(groupedStudyRightSnapshots))),
    updateStudyRights(
      groupedStudyRightSnapshots,
      personIdToStudentNumber,
      personIdToStudyRightIdToPrimality,
      termRegistrations
    ),
  ])

  const mappedTransfers = await parseTransfers(groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber)

  const educations = await selectFromByIds(
    'educations',
    bothStudyrights.map(({ education_id }) => education_id).filter(id => !!id)
  )

  const studyRightIdToEducationType = bothStudyrights.reduce((res, curr) => {
    const education = educations.find(e => e.id === curr.education_id)
    res[curr.id] = education ? education.education_type : null
    return res
  }, {})

  await Promise.all([
    updateStudyRightElements(
      groupedStudyRightSnapshots,
      moduleGroupIdToCode,
      personIdToStudentNumber,
      formattedStudyRights,
      mappedTransfers
    ),
    updateAttainments(attainments, personIdToStudentNumber, attainmentsToBeExluced, studyRightIdToEducationType),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber),
    updateEnrollments(enrollments, personIdToStudentNumber, studyRightIdToEducationType),
    updateStudyplans(studyplans, personIds, personIdToStudentNumber, groupedStudyRightSnapshots),
    bulkCreate(Transfer, mappedTransfers, null, ['studyrightid']),
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

module.exports = {
  updateStudents,
}
