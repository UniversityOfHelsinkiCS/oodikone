const Oodi = require('./oodi_interface')
const OrganisationService = require('../organisations')
const logger = require('../../util/logger')
const mapper = require('./oodi_data_mapper')
const { Student, Studyright, ElementDetails, StudyrightElement, Credit, Course, Teacher, Organisation, StudyrightExtent, CourseType, CourseDisciplines, Discipline, CreditType, Semester, SemesterEnrollment, Provider, CourseProvider, Transfers, CourseRealisationType, CourseRealisation, CourseEnrollment, sequelize, CreditTeacher } = require('../../../src/models/index')
const _ = require('lodash')
const { taskpool } = require('../../util/taskpool')
const { updateAttainmentDates } = require('./update_attainment_dates')

let attainmentIds = new Set()
let courseIds = new Set()
let elementDetailsIds = new Set()

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const getAllStudentInformationFromApi = async studentnumber => {
  const [student, studyrights, studyattainments, semesterEnrollments, courseEnrollments] = await Promise.all([
    Oodi.getStudent(studentnumber),
    Oodi.getStudentStudyRights(studentnumber),
    Oodi.getStudyAttainments(studentnumber),
    Oodi.getSemesterEnrollments(studentnumber),
    Oodi.getCourseEnrollments(studentnumber)
  ])
  return {
    student,
    studyrights,
    studyattainments,
    studentnumber,
    semesterEnrollments,
    courseEnrollments
  }
}

const createOrUpdateStudyrightTransfers = async (apiStudyright, studentnumber) => {
  const transfers = mapper.getTransfersFromData(apiStudyright, studentnumber)
  await Promise.all(transfers.map(transfer => Transfers.upsert(transfer)))
}

const updateStudyrights = async (api, studentnumber) => {
  for (let data of api.studyrights) {
    await StudyrightExtent.upsert(mapper.studyrightDataToExtent(data))
    const [studyright] = await Studyright.upsert(mapper.getStudyRightFromData(data, studentnumber), { returning: true })
    for (let element of data.elements) {
      const elementDetail = mapper.elementDetailFromData(element)
      const studyrightElement = mapper.studyrightElementFromData(element, studyright.studyrightid, studentnumber)
      if (!elementDetailsIds.has(elementDetail.code)) {
        await ElementDetails.upsert(elementDetail)
        elementDetailsIds.add(elementDetail.code)
      }
      await StudyrightElement.upsert(studyrightElement)
    }
    await createOrUpdateStudyrightTransfers(data, studentnumber)
  }
}

const getTeachersFromApi = teacherids => Promise.all(teacherids.map(id => Oodi.getTeacherInfo(id)))

const createTeachers = async (teachers) => {
  await Promise.all(teachers.map(teacher => Teacher.upsert(teacher)))
}

const attainmentAlreadyInDb = attainment => attainmentIds.has(String(attainment.studyattainment_id))

const createCourse = async course => {
  if (!courseIds.has(course.code)) {
    await Course.upsert(course)
    courseIds.add(course.code)
  }
}

const createCourseEnrollment = async (data, studentnumber) => {
  const { courserealisation, courseenrollment, course } = mapper.studentEnrollmentToModels(data, studentnumber)
  await Course.upsert(course)
  await CourseRealisation.upsert(courserealisation)
  await CourseEnrollment.upsert(courseenrollment)
}

const updateCourseEnrollments = async (apidata, studentnumber) => {
  await Promise.all(apidata.courseEnrollments.map(enrollment => createCourseEnrollment(enrollment, studentnumber)))
}

const parseAttainmentData = (data, studentnumber) => {
  return {
    credit: mapper.attainmentDataToCredit(data, studentnumber),
    teachers: mapper.attainmentDataToTeachers(data),
    course: mapper.attainmentDataToCourse(data)
  }
}

const createCreditTeachers = async (credit, teachers) => {
  const creditTeachers = teachers.map(teacher => ({
    credit_id: credit.id,
    teacher_id: teacher.id
  }))
  await Promise.all(creditTeachers.map(ct => CreditTeacher.upsert(ct)))
}

const updateStudyattainments = async (api, studentnumber) => {
  for (let data of api.studyattainments) {
    const { credit, teachers, course } = parseAttainmentData(data, studentnumber)
    if (!attainmentAlreadyInDb(credit)) {
      await createCourse(course)
      await Credit.upsert(credit)
      await createTeachers(teachers)
      await createCreditTeachers(credit, teachers)
    }
  }
}

const updateSemesterEnrollments = async (apidata, studentnumber) => {
  await Promise.all(apidata.semesterEnrollments.map(apiEnrollment => {
    const semesterEnrollment = mapper.semesterEnrollmentFromData(apiEnrollment, studentnumber)
    return SemesterEnrollment.upsert(semesterEnrollment)
  }))
}

const updateStudent = async (studentnumber) => {
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student === null || api.student === undefined) {
    logger.verbose(`API returned ${api.student} for studentnumber ${studentnumber}.    `)
  } else {
    await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
    await Promise.all([
      updateStudyrights(api, studentnumber),
      updateStudyattainments(api, studentnumber),
      updateSemesterEnrollments(api, studentnumber),
      updateCourseEnrollments(api, studentnumber)
    ])
  }
}

const updateStudentFromData = async (api) => {
  if (api.student === null || api.student === undefined) {
    logger.verbose(`API returned ${api.student} for studentnumber ${api.studentnumber}.    `)
  } else {
    const { studentnumber } = api
    await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
    await Promise.all([
      updateStudyrights(api, studentnumber),
      updateStudyattainments(api, studentnumber),
      updateSemesterEnrollments(api, studentnumber),
      updateCourseEnrollments(api, studentnumber)
    ])
  }
}

const getStudentsDataFromApi = numbers => Promise.all(numbers.map(studentnumber => getAllStudentInformationFromApi(studentnumber)))

const updateStudents = async (studentnumbers, chunksize = 1, onUpdateStudent = undefined) => {
  const runOnUpdate = _.isFunction(onUpdateStudent)
  const remaining = studentnumbers.slice(0)
  while (remaining.length > 0) {
    const nextchunk = remaining.splice(0, chunksize)
    await Promise.all(nextchunk.map(async studentnumber => {
      await updateStudent(studentnumber)
      if (runOnUpdate) {
        onUpdateStudent()
      }
    }))
  }
}

const updateStudentsTaskPooled = async (studentnumbers, chunksize = 1, onUpdateStudent = undefined) => {
  const remaining = studentnumbers.slice(0)
  const runOnUpdate = _.isFunction(onUpdateStudent)
  const pool = taskpool(5)
  while (remaining.length > 0) {
    const nextchunk = remaining.splice(0, chunksize)
    const apidata = await getStudentsDataFromApi(nextchunk)
    await pool.enqueue(() => Promise.all(apidata.map(async data => {
      await updateStudentFromData(data, onUpdateStudent)
      if (runOnUpdate) {
        onUpdateStudent()
      }
    })))
  }
  await pool.complete()
}

const getFaculties = () => {
  return Promise.all([OrganisationService.all(), Oodi.getFaculties()])
}

const updateFaculties = async () => {
  const [dbFacultiesArray, apiFacultiesArray] = await getFaculties()
  const dbFacultyCodes = new Set(dbFacultiesArray.map(faculty => faculty.code))
  await Promise.all(apiFacultiesArray.map(async faculty => {
    if (dbFacultyCodes.has(faculty.code)) {
      return
    }
    await Organisation.upsert(mapper.getOrganisationFromData(faculty))
  }))
}

const createCourseType = data => {
  const coursetype = mapper.courseTypeFromData(data)
  return CourseType.upsert(coursetype)
}

const updateCourseTypeCodes = async () => {
  const apiCourseTypes = await Oodi.getCourseTypeCodes()
  await Promise.all(apiCourseTypes.map(createCourseType))
}

const createOrUpdateTeacher = async teacher => {
  if (teacher !== null) {
    return Teacher.upsert(mapper.getTeacherFromData(teacher))
  }
}

const updateTeacherInfo = async (teacherids, chunksize = 1) => {
  const teacherchunks = _.chunk(teacherids, chunksize)
  for (let chunk of teacherchunks) {
    const apidata = await getTeachersFromApi(chunk)
    await Promise.all(apidata.map(createOrUpdateTeacher))
  }
}

const updateTeacherInfoTaskPooled = async (teacherids, chunksize = 1) => {
  const teacherchunks = _.chunk(teacherids, chunksize)
  const pool = taskpool()
  for (let chunk of teacherchunks) {
    const apidata = await getTeachersFromApi(chunk)
    await pool.enqueue(() => sequelize.transaction(() => Promise.all(apidata.map(createOrUpdateTeacher))))
  }
  await pool.complete()
}

const updateTeachersInDb = async (chunksize = 50, usetaskpool = true) => {
  const dbteachers = await Teacher.findAll({ attributes: ['id'] })
  if (usetaskpool === true) {
    await updateTeacherInfoTaskPooled(dbteachers.map(teacher => teacher.id), chunksize)
  } else {
    await updateTeacherInfo(dbteachers.map(teacher => teacher.id), chunksize)
  }
}

const getLearningOpportunityFromApi = (courseids) => {
  return Promise.all(courseids.map(courseid => Oodi.getLearningOpportunity(courseid)))
}

const createOrUpdateCourseFromLearningOpportunityData = async data => {
  await Course.upsert(mapper.learningOpportunityDataToCourse(data))
  await Promise.all((mapper.learningOpportunityDataToCourseDisciplines(data).map(coursediscipline => CourseDisciplines.upsert(coursediscipline))))
}

const createOrUpdateCourseProviders = async data => {
  const { providers, courseproviders } = mapper.learningOpportunityDataToCourseProviders(data)
  await Promise.all(providers.map(provider => Provider.upsert(provider)))
  await Promise.all(courseproviders.map(courseprovider => CourseProvider.upsert(courseprovider)))
}

const updateCourseInformationAndProviders = async (courseids, chunksize = 1) => {
  const coursechunks = _.chunk(courseids, chunksize)
  for (let chunk of coursechunks) {
    const apidata = await getLearningOpportunityFromApi(chunk)
    await Promise.all(apidata.map(async data => {
      if (data) {
        await createOrUpdateCourseFromLearningOpportunityData(data)
        await createOrUpdateCourseProviders(data)
      }
    }))
  }
}

const updateCoursesAndProvidersInDb = async (chunksize = 1) => {
  const dbcourses = await Course.findAll({ attributes: ['code'] })
  await updateCourseInformationAndProviders(dbcourses.map(course => course.code), chunksize)
}

const updateCreditTypeCodes = async () => {
  const apiStudyAttainmentStatusCodes = await Oodi.getStudyattainmentStatusCodes()
  const creditTypes = apiStudyAttainmentStatusCodes.map(mapper.studyattainmentStatusCodeToCreditType)
  await Promise.all(creditTypes.map(type => CreditType.upsert(type)))
}

const updateCourseDisciplines = async () => {
  const apiCourseDisciplines = await Oodi.getCourseDisciplines()
  const courseDisciplines = apiCourseDisciplines.map(mapper.disciplineFromData)
  await Promise.all(courseDisciplines.map(discipline => Discipline.upsert(discipline)))
}

const saveSemestersAwesome = semesters => sequelize.transaction(() => {
  return Promise.all(semesters.map(data => Semester.upsert(mapper.semesterFromData(data))))
})

const updateSemesters = async (usenew = true) => {
  const apiSemesters = await Oodi.getSemesters()
  if (usenew === true) {
    return await saveSemestersAwesome(apiSemesters)
  } else {
    return await Promise.all(apiSemesters.map(data => Semester.upsert(mapper.semesterFromData(data))))
  }
}

const updateCourseRealisationTypes = async () => {
  const apiTypes = await Oodi.getCourseRealisationTypes()
  await Promise.all(apiTypes.map(data => CourseRealisationType.upsert(mapper.courseRealisationTypeFromData(data))))
}

const getExistingCourseRealisationCodes = async (since, courseids) => {
  const validIds = new Set(courseids)
  const isValidCourse = data => (
    data !== undefined
    && data.deleted !== 'true'
    && validIds.has(data.learningopportunity_id)
  )
  const all = await Oodi.courseUnitRealisationsSince(since)
  return all.filter(isValidCourse).map(data => `${data.course_id}`)
}

const updateCourseRealisationsAndEnrollments = async (courseids, since = '0000-01-01', chunksize = 50) => {
  const apidata = await getExistingCourseRealisationCodes(since, courseids)
  const chunks = _.chunk(apidata, chunksize)
  const pool = taskpool(5)
  for (let chunk of chunks) {
    const datas = await Promise.all(chunk.map(courserealisation_id => Oodi.getCourseUnitRealisation(courserealisation_id)))
    await pool.enqueue(() => Promise.all(datas.map(async data => {
      if (!data) {
        return
      }
      const { course, courserealisation, courseenrollments, students } = mapper.courseUnitRealisationDataToModels(data)
      await Course.upsert(course)
      await CourseRealisation.upsert(courserealisation)
      await Promise.all(students.map(student => Student.upsert(student)))
      await Promise.all(courseenrollments.map(enrollment => CourseEnrollment.upsert(enrollment)))
    })))
  }
  await pool.complete()
}

const updateCourseRealisationsForCoursesInDb = async () => {
  const courses = await Course.findAll()
  await updateCourseRealisationsAndEnrollments(courses.map(course => course.code))
}

const updateDatabase = async (studentnumbers, onUpdateStudent) => {
  if (process.env.NODE_ENV !== 'anon') {
    await updateFaculties()
  }
  await updateCourseRealisationTypes()
  await updateSemesters()
  await updateCreditTypeCodes()
  await updateCourseTypeCodes()
  await updateCourseDisciplines()
  await updateStudentsTaskPooled(studentnumbers, 50, onUpdateStudent)
  await updateTeachersInDb(100, true)
  await updateCoursesAndProvidersInDb(100)
  await updateAttainmentDates()
}

module.exports = { updateDatabase, updateFaculties, updateStudents, updateCourseInformationAndProviders, updateCreditTypeCodes, updateCourseDisciplines, updateSemesters, updateCourseRealisationTypes, updateTeachersInDb, updateStudentsTaskPooled, updateCourseRealisationsAndEnrollments, getExistingCourseRealisationCodes, updateCourseRealisationsForCoursesInDb }