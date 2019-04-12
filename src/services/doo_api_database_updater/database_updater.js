const Oodi = require('./oodi_interface')
const OrganisationService = require('../organisations')
const mapper = require('./oodi_data_mapper')
const {
  Student, Studyright, ElementDetails, StudyrightElement, Credit, Course,
  Teacher, Organisation, StudyrightExtent, CourseType, CourseDisciplines,
  Discipline, CreditType, Semester, SemesterEnrollment, Provider, CourseProvider,
  Transfers, CourseRealisationType, CourseRealisation, CourseEnrollment, sequelize,
  CreditTeacher, ErrorData
} = require('../../../src/models/index')

const _ = require('lodash')
const { taskpool } = require('../../util/taskpool')
const { updateAttainmentDates } = require('./update_attainment_dates')

let attainmentIds = new Set()
let courseIds = new Set()
let elementDetailsIds = new Set()

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
  console.log(`update studyrights called for ${studentnumber}`)
  if (api.studyrights.length === 0) {
    console.log(`No studyrights for ${studentnumber}`)
    return
  }
  for (let data of api.studyrights) {
    await StudyrightExtent.upsert(mapper.studyrightDataToExtent(data))
    console.log('got studyrightextent')
    const [studyright] = await Studyright.upsert(mapper.getStudyRightFromData(data, studentnumber), { returning: true })
    console.log('got studyright')
    let i = 0
    for (let element of data.elements) {
      i = i + 1
      const elementDetail = mapper.elementDetailFromData(element)
      const studyrightElement = mapper.studyrightElementFromData(element, studyright.studyrightid, studentnumber)
      if (!elementDetailsIds.has(elementDetail.code)) {
        await ElementDetails.upsert(elementDetail)
        elementDetailsIds.add(elementDetail.code)
      }
      await StudyrightElement.upsert(studyrightElement)
      console.log(`${i}/${data.elements.length} studyright elements updated`)
    }
    await createOrUpdateStudyrightTransfers(data, studentnumber)
    console.log(`studyrights updated for ${studentnumber}`)
  }
}

const getTeachersFromApi = teacherids => Promise.all(teacherids.map(id => Oodi.getTeacherInfo(id)))

const createTeachers = async (teachers) => {
  await Promise.all(teachers.map(teacher => Teacher.upsert(teacher)))
}

const attainmentAlreadyInDb = attainment => attainmentIds.has(String(attainment.studyattainment_id))

const createCourse = async course => {
  if (!courseIds.has(course.code)) {
    courseIds.add(course.code)
    await Course.upsert(course)
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
  console.log(`course enrollments updated for ${studentnumber}`)
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
  console.log(`update studyattainments called for ${studentnumber}`)
  if (api.studyattainments.length === 0) {
    console.log(`No study attainments for ${studentnumber}`)
    return
  }
  for (let data of api.studyattainments) {
    const { credit, teachers, course } = parseAttainmentData(data, studentnumber)
    console.log(credit)
    if (!attainmentAlreadyInDb(credit)) {
      await createCourse(course)
      if (!credit.semestercode) {
        await ErrorData.upsert({
          id: credit.id || Math.round(String(Math.random() * 34893723)) + String(666),
          data: credit
        })
        const tamperedCredit = { ...credit, semestercode: mapper.getSemesterCode(credit.attainment_date) }
        await Credit.upsert(tamperedCredit)
      } else {
        await Credit.upsert(credit)
      }
      await createTeachers(teachers)
      await createCreditTeachers(credit, teachers)
    }
    console.log(`Studyattainments updated for ${studentnumber}`)
  }
}

const updateSemesterEnrollments = async (apidata, studentnumber) => {
  await Promise.all(apidata.semesterEnrollments.map(apiEnrollment => {
    const semesterEnrollment = mapper.semesterEnrollmentFromData(apiEnrollment, studentnumber)
    return SemesterEnrollment.upsert(semesterEnrollment)
  }))
  console.log(`semester enrollments updated for ${studentnumber}`)
}

const deleteStudentStudyrights = async studentnumber => {
  await Studyright.destroy({
    where: {
      student_studentnumber: studentnumber
    }
  })
  await StudyrightElement.destroy({
    where: {
      studentnumber
    }
  })
}

const updateStudent = async (studentnumber) => {
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student === null || api.student === undefined) {
    console.log(`API returned ${api.student} for studentnumber ${studentnumber}.    `)
  } else {
    console.log(`TRYING TO UPDATE ${studentnumber}`)
    await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
    await deleteStudentStudyrights(studentnumber)
    await Promise.all([
      updateStudyrights(api, studentnumber),
      updateStudyattainments(api, studentnumber),
      updateSemesterEnrollments(api, studentnumber),
      updateCourseEnrollments(api, studentnumber)
    ])
    console.log(`SUCCESSFULLY UPDATED ${studentnumber}`)
  }
}

const updateStudentFromData = async (api) => {
  if (api.student === null || api.student === undefined) {
    console.log(`API returned ${api.student} for studentnumber ${api.studentnumber}.    `)
  } else {
    const { studentnumber } = api
    console.log(`TRYING TO UPDATE ${studentnumber}`)
    await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
    await deleteStudentStudyrights(studentnumber)
    await Promise.all([
      updateStudyrights(api, studentnumber),
      updateStudyattainments(api, studentnumber),
      updateSemesterEnrollments(api, studentnumber),
      updateCourseEnrollments(api, studentnumber)
    ])
  }
}

const getStudentsDataFromApi = numbers => Promise.all(numbers.map(studentnumber =>
  getAllStudentInformationFromApi(studentnumber)))

const updateStudents = async (studentnumbers, chunksize = 1, onUpdateStudent = undefined) => {
  const runOnUpdate = _.isFunction(onUpdateStudent)
  const remaining = studentnumbers.slice(0)
  while (remaining.length > 0) {
    console.log(`remaining: ${remaining.length}`)
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
  await Promise.all((mapper.learningOpportunityDataToCourseDisciplines(data).map(coursediscipline =>
    CourseDisciplines.upsert(coursediscipline))))
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

const updateSemesters = async () => {
  const apiSemesters = await Oodi.getSemesters()
  return await Promise.all(apiSemesters.map(data => Semester.upsert(mapper.semesterFromData(data))))
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
    const datas = await Promise.all(chunk.map(courserealisation_id =>
      Oodi.getCourseUnitRealisation(courserealisation_id)))
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
  await updateStudents(studentnumbers, 25, onUpdateStudent)
  await updateTeachersInDb(100, true)
  await updateCoursesAndProvidersInDb(100)
  await updateAttainmentDates()
}

module.exports = {
  updateDatabase, updateFaculties, updateStudents, updateCourseInformationAndProviders,
  updateCreditTypeCodes, updateCourseDisciplines, updateSemesters, updateCourseRealisationTypes,
  updateTeachersInDb, updateStudentsTaskPooled, updateCourseRealisationsAndEnrollments,
  getExistingCourseRealisationCodes, updateCourseRealisationsForCoursesInDb,
  deleteStudentStudyrights
}