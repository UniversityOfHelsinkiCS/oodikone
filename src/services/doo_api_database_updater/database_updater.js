const Oodi = require('./oodi_interface')
const OrganisationService = require('../organisations')
const logger = require('../../util/logger')
const mapper = require('./oodi_data_mapper')
const { Student, Studyright, ElementDetails, StudyrightElement, Credit, Course, CourseInstance, Teacher, Organisation, CourseTeacher, StudyrightExtent, CourseType, CourseDisciplines, Discipline, CreditType, Semester } = require('../../../src/models/index')
const _ = require('lodash')

let attainmentIds = new Set()
let courseIds = new Set()
let elementDetailsIds = new Set()

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const getAllStudentInformationFromApi = async studentnumber => {
  const [student, studyrights, studyattainments] = await Promise.all([
    Oodi.getStudent(studentnumber),
    Oodi.getStudentStudyRights(studentnumber),
    Oodi.getStudyAttainments(studentnumber),
  ])
  return {
    student,
    studyrights,
    studyattainments,
    studentnumber
  }
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
  }
}

const getTeachersFromApi = teacherids => Promise.all(teacherids.map(id => Oodi.getTeacherInfo(id)))

const createTeachers = async (attainment, courseinstance) => {
  const teachers = await mapper.attainmentDataToTeachers(attainment)
  await Promise.all(teachers.map(teacher => Teacher.upsert(teacher)))
  await Promise.all(teachers.map(teacher => CourseTeacher.upsert(mapper.courseTeacherFromData(teacher.id, courseinstance.id))))
}

const attainmentAlreadyInDb = attainment => attainmentIds.has(String(attainment.studyattainment_id))

const createCourse = async course => {
  if (!courseIds.has(course.code)) {
    await Course.upsert(course)
    courseIds.add(course.code)
  }
}

const createCourseInstance = async (courseinstance, returning=false) => {
  const record = await CourseInstance.upsert(courseinstance, { returning })
  return returning === true ? record[0] : undefined
}

const updateStudyattainments = async (api, studentnumber) => {
  for (let data of api.studyattainments) {
    const attainment = mapper.attainmentDataToCredit(data)
    if (!attainmentAlreadyInDb(attainment)) {
      await createCourse(mapper.attainmentDataToCourse(data))
      const courseinstance = await createCourseInstance(mapper.attainmentDataToCourseInstance(data), true)
      await Credit.upsert(mapper.attainmentDataToCredit(data, courseinstance.id, studentnumber))
      await createTeachers(data, courseinstance)
    }
  }
}

const updateStudent = async (studentnumber) => {
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student === null || api.student === undefined) {
    logger.verbose(`API returned ${api.student} for studentnumber ${studentnumber}.    `)
  } else {
    await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
    await Promise.all([
      updateStudyrights(api, studentnumber),
      updateStudyattainments(api, studentnumber)
    ])
  }
}

const updateStudents = async (studentnumbers, chunksize=1, onUpdateStudent=undefined) => {
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
    await Teacher.upsert(mapper.getTeacherFromData(teacher))
  }
}

const updateTeacherInfo = async (teacherids, chunksize=1) => {
  const teacherchunks = _.chunk(teacherids, chunksize)
  for (let chunk of teacherchunks) {
    const apidata = await getTeachersFromApi(chunk)
    await Promise.all(apidata.map(createOrUpdateTeacher))
  }
}

const updateTeachersInDb = async () => {
  const dbteachers = await Teacher.findAll({ attributes: ['id']})
  await updateTeacherInfo(dbteachers.map(teacher => teacher.id)) 
}

const getLearningOpportunityFromApi = (courseids) => {
  return Promise.all(courseids.map(courseid => Oodi.getLearningOpportunity(courseid)))
}

const createOrUpdateCourseFromLearningOpportunityData = async data => {
  if (data !== null) {
    await Course.upsert(mapper.learningOpportunityDataToCourse(data))
    await Promise.all((mapper.learningOpportunityDataToCourseDisciplines(data).map(coursediscipline => CourseDisciplines.upsert(coursediscipline))))
  }
}

const updateCourseInformation = async (courseids, chunksize=1) => {
  const coursechunks = _.chunk(courseids, chunksize)
  for (let chunk of coursechunks) {
    const apidata = await getLearningOpportunityFromApi(chunk)
    await Promise.all(apidata.map(data => createOrUpdateCourseFromLearningOpportunityData(data)))
  }
}

const updateCoursesInDb = async (chunksize=1) => {
  const dbcourses = await Course.findAll({ attributes: ['code'] })
  await updateCourseInformation(dbcourses.map(course => course.code), chunksize)
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
  await Promise.all(apiSemesters.map(data => Semester.upsert(mapper.semesterFromData(data))))
}

const updateDatabase = async (studentnumbers, onUpdateStudent) => {
  if (process.env.NODE_ENV !== 'anon') {
    await updateFaculties()
  }
  await updateSemesters()
  await updateCreditTypeCodes()
  await updateCourseTypeCodes()
  await updateCourseDisciplines()
  await updateStudents(studentnumbers, 100, onUpdateStudent)
  await updateTeachersInDb(100)
  await updateCoursesInDb(100)
}

module.exports = { updateDatabase, updateFaculties, updateStudents, updateCourseInformation, updateCreditTypeCodes, updateCourseDisciplines, updateSemesters }