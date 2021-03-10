const { Op } = require('sequelize')
const { flatten, uniqBy, sortBy, groupBy, orderBy, has, get, uniq, isEqual } = require('lodash')
const {
  Course,
  Student,
  SemesterEnrollment,
  Teacher,
  Credit,
  CreditTeacher,
  Transfer
} = require('../../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate, getCourseUnitsByCodes } = require('../../db')
const { getEducation, getUniOrgId, loadMapsIfNeeded, getEducationType } = require('../shared')
const {
  studentMapper,
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper
} = require('../mapper')
const { isBaMa } = require('../../utils')
const { updateStudyRights, updateStudyRightElements, updateElementDetails } = require('./studyRightUpdaters')

const studyRightHasDegreeEducation = (studyRight) => {
  const education = getEducation(studyRight.education_id)
  if (!education) return true
  const educationType = getEducationType(education.education_type)
  if (!educationType) return true
  return educationType.parent_id !== 'urn:code:education-type:non-degree-education'
}

const takeDegreeStudyRightSnapshots = (studyRightSnapshots) => {
  return studyRightSnapshots.filter(studyRight => studyRightHasDegreeEducation(studyRight))
}

const groupStudyrightSnapshots = (studyRightSnapshots) => {
  const snapshotsBystudyright = Object.entries(
    groupBy(
      studyRightSnapshots.filter(sR => sR.document_state === 'ACTIVE'),
      'id'
    )
  )    

  return snapshotsBystudyright.reduce((res, [id, snapshots]) => {
    const byPhases = s => {
      const phase1 = s.accepted_selection_path.educationPhase1GroupId
      const phase2 = s.accepted_selection_path.educationPhase2GroupId ? s.accepted_selection_path.educationPhase2GroupId : 'none'
      return `${phase1}-${phase2}`
    }

    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'desc')

    const groupedByPhases = groupBy(orderedSnapshots, byPhases)
    
    const snapshotsWithRightDate = Object.keys(groupedByPhases).map(key => {
      const snapshots = groupedByPhases[key]
      const most_recent = snapshots[0]
      const the_first = snapshots[snapshots.length-1]
      most_recent.first_snapshot_date_time = the_first.snapshot_date_time

      return most_recent
    })

    res[id] = snapshotsWithRightDate

    return res
  }, {})
}


const updateStudents = async personIds => {
  await loadMapsIfNeeded()

  const [students, studyRightSnapshots, attainments, termRegistrations, studyRightPrimalities] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id'),
    selectFromByIds('study_right_primalities', personIds, 'student_id')
  ])

  const degreeStudyRightSnapshots = takeDegreeStudyRightSnapshots(studyRightSnapshots)

  // grouping in function that sets first_snapshot_date_time
  const groupedStudyRightSnapshots = groupStudyrightSnapshots(degreeStudyRightSnapshots)

  const latestStudyRights = Object.values(groupedStudyRightSnapshots).reduce((acc, curr) => {
    acc.push(curr[0])
    return acc
  }, [])

  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const personIdToStudyRightIdToPrimality = studyRightPrimalities.reduce((res, curr) => {
    if (!res[curr.student_id]) res[curr.student_id] = {}
    res[curr.student_id][curr.study_right_id] = curr
    return res
  }, {})

  const mappedStudents = students.map(studentMapper(attainments, degreeStudyRightSnapshots))
  await bulkCreate(Student, mappedStudents)

  const [moduleGroupIdToCode] = await Promise.all([
    updateElementDetails(flatten(Object.values(groupedStudyRightSnapshots))),
    updateStudyRights(latestStudyRights, personIdToStudentNumber, personIdToStudyRightIdToPrimality)
  ])

  await Promise.all([
    updateStudyRightElements(groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber),
    updateTransfers(groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber),
    updateAttainments(attainments, personIdToStudentNumber),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber)
  ])
}


const updateTransfers = async (groupedStudyRightSnapshots, moduleGroupIdToCode, personIdToStudentNumber) => {
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
        : studyrightid

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

  const transfers = []
  Object.values(groupedStudyRightSnapshots).forEach(snapshots => {
    const orderedSnapshots = orderBy(snapshots, s => new Date(s.snapshot_date_time), 'asc')
    transfers.push(...getTransfersFrom(orderedSnapshots, snapshots[0].id, snapshots[0].education_id))
  })

  await bulkCreate(Transfer, transfers)
}

const updateAttainments = async (attainments, personIdToStudentNumber) => {
  const personIdToEmployeeNumber = await updateTeachers(attainments)
  const [courseUnits, modules] = await Promise.all([
    selectFromByIds(
      'course_units',
      attainments.map(a => a.course_unit_id).filter(id => !!id)
    ),
    selectFromByIds(
      'modules',
      attainments.map(a => a.module_group_id).filter(id => !!id),
      'group_id'
    )
  ])

  const courseUnitIdToCourseGroupId = courseUnits.reduce((res, curr) => {
    res[curr.id] = curr.group_id
    return res
  }, {})

  const moduleGroupIdToModuleCode = modules.reduce((res, curr) => {
    res[curr.group_id] = curr.code
    return res
  }, {})

  const courseGroupIdToCourseCode = (
    await Course.findAll({
      where: {
        id: {
          [Op.in]: Object.values(courseUnitIdToCourseGroupId)
        }
      }
    })
  ).reduce((res, curr) => {
    res[curr.id] = curr.code
    return res
  }, {})

  const properAttainmentTypes = new Set(['CourseUnitAttainment', 'ModuleAttainment', 'DegreeProgrammeAttainment', 'CustomCourseUnitAttainment'])
  const creditTeachers = []

  // This mayhem fixes missing course_unit references for CustomCourseUnitAttainments.
  const fixCustomCourseUnitAttainments = async (attainments) => {
    const addCourseUnitToCustomCourseUnitAttainments = (courses, attIdToCourseCode) => (att) => {
      if (att.type !== 'CustomCourseUnitAttainment') return att
  
      const courseUnits = courses.filter(c => c.code === attIdToCourseCode[att.id])
  
      let courseUnit = courseUnits.find(cu => {
        const { startDate, endDate } = cu.validity_period
        const attainment_date = new Date(att.attainment_date)
  
        const isAfterStart = new Date(startDate) <= attainment_date
        const isBeforeEnd = !endDate || new Date(endDate) > attainment_date
  
        return isAfterStart && isBeforeEnd
      })
  
      if (!courseUnit) {
        /**
         * Sometimes registrations are fakd, see attainment hy-opinto-141561630. The attainmentdate is outside of all courses, yet should be mapped.
         */
        courseUnit = courseUnits.find(cu => {
          const { startDate, endDate } = cu.validity_period
          const date = new Date(att.registration_date)
    
          const isAfterStart = new Date(startDate) <= date
          const isBeforeEnd = !endDate || new Date(endDate) > date
    
          return isAfterStart && isBeforeEnd
        })
        if (!courseUnit) return att
      }
  
      // Add the course to the mapping objects for creditMapper to work properly.
      courseUnitIdToCourseGroupId[courseUnit.id] = courseUnit.group_id
      courseGroupIdToCourseCode[courseUnit.group_id] = courseUnit.code
  
      return { ...att, course_unit_id: courseUnit.id }
    }
  
    const findMissingCourseCodes = (attainmentIdCodeMap, att) => {
      if (att.type !== 'CustomCourseUnitAttainment') return attainmentIdCodeMap
      if (!att.code) return attainmentIdCodeMap
  
      const codeParts = att.code.split(/\-\d+$/)
      if (!codeParts.length) return attainmentIdCodeMap
  
      const parsedCourseCode = codeParts[0]
      return { ...attainmentIdCodeMap, [att.id]: parsedCourseCode }
    }

    const attainmentIdCourseCodeMapForCustomCourseUnitAttainments = attainments.reduce(findMissingCourseCodes, {})
    const missingCodes = Object.values(attainmentIdCourseCodeMapForCustomCourseUnitAttainments)
    const courses = await getCourseUnitsByCodes(missingCodes)
    return attainments.map(addCourseUnitToCustomCourseUnitAttainments(courses, attainmentIdCourseCodeMapForCustomCourseUnitAttainments))
  }

  const fixedAttainments = await fixCustomCourseUnitAttainments(attainments) 

  const mapCredit = creditMapper(
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    moduleGroupIdToModuleCode,
    courseGroupIdToCourseCode
  )

  const credits = fixedAttainments
    .filter(a => a !== null)
    .filter(a => properAttainmentTypes.has(a.type) && !a.misregistration)
    .map(a => {
      a.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by' && !!p.personId)
        .forEach(p => {
          const employeeNumber = personIdToEmployeeNumber[p.personId]
          creditTeachers.push({ composite: `${a.id}-${employeeNumber}`, credit_id: a.id, teacher_id: employeeNumber })
        })

      return mapCredit(a)
    })
    .filter(c => !!c)

  await bulkCreate(Credit, credits)
  await bulkCreate(
    CreditTeacher,
    uniqBy(creditTeachers, cT => cT.composite),
    null,
    ['composite']
  )
}

const updateTeachers = async attainments => {
  const acceptorPersonIds = flatten(
    attainments.map(attainment =>
      attainment.acceptor_persons
        .filter(p => p.roleUrn === 'urn:code:attainment-acceptor-type:approved-by')
        .map(p => p.personId)
    )
  ).filter(p => !!p)

  const personIdToEmployeeNumber = {}
  const teachers = (await selectFromByIds('persons', acceptorPersonIds))
    .filter(p => !!p.employee_number)
    .map(p => {
      personIdToEmployeeNumber[p.id] = p.employee_number
      return mapTeacher(p)
    })

  // Sort to avoid deadlocks
  await bulkCreate(Teacher, sortBy(teachers, ['id']))
  return personIdToEmployeeNumber
}

// why we are using two terms for the same thing: term registration and semester enrollment
const semesterEnrolmentsOfStudent = (allSementerEnrollments) => {
  const semesters = uniq(allSementerEnrollments.map(s => s.semestercode))
  const semesterEnrollments = semesters.map(semester => {
    const enrolmentsForSemster = allSementerEnrollments.filter(se => se.semestercode === semester)

    const present = enrolmentsForSemster.find(se => se.enrollmenttype === 1)
    if ( present ) {
      return present
    }
    const absent = enrolmentsForSemster.find(se => se.enrollmenttype === 2)
    if ( absent ) {
      return absent
    }

    return enrolmentsForSemster[0]
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
      .filter(t => studyRights.some(r => r.id === t.study_right_id))
      .map(({ student_id, term_registrations, study_right_id }) =>
        term_registrations.map(mapSemesterEnrollment(student_id, study_right_id))
      )
  )

  const enrolmentsByStudents = groupBy(allSementerEnrollments, (e) => e.studentnumber)
  const semesterEnrollments = flatten(Object.values(enrolmentsByStudents).map(semesterEnrolmentsOfStudent))

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

module.exports = {
  updateStudents
}
