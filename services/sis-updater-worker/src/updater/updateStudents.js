const { Op } = require('sequelize')
const { flatten, uniqBy } = require('lodash')
const {
  Course,
  Student,
  SemesterEnrollment,
  Teacher,
  Credit,
  CreditTeacher,
  ElementDetail,
  Studyright,
  StudyrightElement
} = require('../db/models')
const { selectFromByIds, selectFromSnapshotsByIds, bulkCreate } = require('../db')
const {
  init: initMaps,
  areMapsInitialized,
  educationTypeToExtentcode,
  getEducationType,
  getEducation,
  getUniOrgId
} = require('./shared')
const {
  studentMapper,
  studyrightMapper,
  mapStudyrightElements,
  mapTeacher,
  creditMapper,
  semesterEnrollmentMapper
} = require('./mapper')

const updateStudents = async personIds => {
  if (!areMapsInitialized()) await initMaps()

  const [students, studyRights, attainments, termRegistrations] = await Promise.all([
    selectFromByIds('persons', personIds),
    selectFromSnapshotsByIds('studyrights', personIds, 'person_id'),
    selectFromByIds('attainments', personIds, 'person_id'),
    selectFromByIds('term_registrations', personIds, 'student_id')
  ])

  const personIdToStudentNumber = students.reduce((res, curr) => {
    res[curr.id] = curr.student_number
    return res
  }, {})

  const mappedStudents = students.map(studentMapper(attainments, studyRights))
  await bulkCreate(Student, mappedStudents)

  await updateStudyRights(studyRights, personIdToStudentNumber)
  await Promise.all([
    updateAttainments(attainments, personIdToStudentNumber),
    updateTermRegistrations(termRegistrations, personIdToStudentNumber)
  ])
}

const updateStudyRights = async (studyRights, personIdToStudentNumber) => {
  const moduleGroupIdToCode = await updateElementDetails(studyRights)
  const mapStudyright = studyrightMapper(personIdToStudentNumber)

  const studyrightElements = []
  const formattedStudyRights = studyRights.reduce((acc, studyright) => {
    const studyRightEducation = getEducation(studyright.education_id)
    if (!studyRightEducation) return acc

    if (
      studyRightEducation.education_type === 'urn:code:education-type:degree-education:bachelors-and-masters-degree' // :D
    ) {
      const studyRightBach = mapStudyright(studyright, {
        extentcode: 1,
        studyrightid: `${studyright.id}-1`
      })

      const [bachProgramme, bachStudytrack] = mapStudyrightElements(
        studyRightBach,
        moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1GroupId],
        moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1ChildGroupId]
      )
      studyrightElements.push(bachProgramme, bachStudytrack)

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
          : null
      })

      const [mastProgramme, mastStudytrack] = mapStudyrightElements(
        studyRightMast,
        moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase2GroupId],
        moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase2ChildGroupId]
      )
      studyrightElements.push(mastProgramme, mastStudytrack)
      acc.push(studyRightMast, studyRightBach)
    } else {
      const educationType = getEducationType(studyRightEducation.education_type)
      const mappedStudyright = mapStudyright(studyright, {
        extentcode: educationTypeToExtentcode[educationType.id] || educationTypeToExtentcode[educationType.parent_id]
      })
      acc.push(mappedStudyright)

      const [programme, studytrack] = mapStudyrightElements(
        mappedStudyright,
        moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1GroupId],
        moduleGroupIdToCode[studyright.accepted_selection_path.educationPhase1ChildGroupId]
      )
      studyrightElements.push(programme, studytrack)
    }
    return acc
  }, [])

  await bulkCreate(Studyright, formattedStudyRights, null, ['studyrightid'])
  await bulkCreate(
    StudyrightElement,
    studyrightElements.filter(s_element => !!s_element.code)
  )
}

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

      acc[20].add(educationPhase1GroupId)
      acc[20].add(educationPhase2GroupId)
      acc[30].add(educationPhase1ChildGroupId)
      acc[30].add(educationPhase2ChildGroupId)

      return acc
    },
    { 20: new Set(), 30: new Set() }
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

  const mappedProgrammes = programmes.map(programme => ({ ...programme, type: 20 }))
  const mappedStudytracks = studytracks.map(studytrack => ({ ...studytrack, type: 30 }))

  await bulkCreate(
    ElementDetail,
    uniqBy([...mappedProgrammes, ...mappedStudytracks], e => e.code),
    null,
    ['code']
  )

  return [...mappedProgrammes, ...mappedStudytracks].reduce((acc, curr) => {
    acc[curr.group_id] = curr.code
    return acc
  }, {})
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
  })

  const mapCredit = creditMapper(
    personIdToStudentNumber,
    courseUnitIdToCourseGroupId,
    moduleGroupIdToModuleCode,
    courseGroupIdToCourseCode
  )
  const properAttainmentTypes = new Set(['CourseUnitAttainment', 'ModuleAttainment'])
  const creditTeachers = []

  const credits = attainments
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
  await bulkCreate(Teacher, teachers)
  return personIdToEmployeeNumber
}

const updateTermRegistrations = async (termRegistrations, personIdToStudentNumber) => {
  const studyRightIds = termRegistrations.map(({ study_right_id }) => study_right_id)
  const studyRights = await selectFromSnapshotsByIds('studyrights', studyRightIds)

  const studyrightToUniOrgId = studyRights.reduce((res, curr) => {
    res[curr.id] = getUniOrgId(curr.organisation_id)
    return res
  }, {})

  const mapSemesterEnrollment = semesterEnrollmentMapper(personIdToStudentNumber, studyrightToUniOrgId)
  const semesterEnrollments = uniqBy(
    flatten(
      termRegistrations.map(({ student_id, term_registrations, study_right_id }) =>
        term_registrations.map(mapSemesterEnrollment(student_id, study_right_id))
      )
    ),
    sE => `${sE.studentnumber}${sE.semestercomposite}`
  )

  await bulkCreate(SemesterEnrollment, semesterEnrollments)
}

module.exports = {
  updateStudents
}
