const Oodi = require('./oodi_interface_new')
const OrganisationService = require('../organisations')
const logger = require('../../util/logger')
const mapper = require('./oodi_data_mapper')
const { Student, Studyright, ElementDetails, StudyrightElement, Credit, Course, CourseInstance, Teacher, Organisation } = require('../../../src/models/index')
const TeacherService = require('../teachers') 

const DEFAULT_TEACHER_ROLE = 'Teacher'

let attainmentIds = new Set()
let courseIds = new Set()
let elementDetailsIds = new Set()

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const getAllStudentInformationFromApi = async studentnumber => {
  const [ student, studyrights, studyattainments ] = await Promise.all([
    Oodi.getStudent(studentnumber),
    Oodi.getStudentStudyRights(studentnumber),
    Oodi.getStudyAttainments(studentnumber),
  ])
  return {
    student,
    studyrights,
    studyattainments
  }
}

const updateStudyrights = async api => {
  for (let data of api.studyrights) {
    const [ studyright ] = await Studyright.upsert(mapper.getStudyRightFromData(data), { returning: true })
    for (let element of data.elements) {
      const elementDetail = mapper.elementDetailFromData(element)
      const studyrightElement = mapper.studyrightElementFromData(element, studyright.studyrightid)
      if (!elementDetailsIds.has(elementDetail.code)) {
        await ElementDetails.upsert(elementDetail)
        elementDetailsIds.add(elementDetail.code)
      }
      await StudyrightElement.upsert(studyrightElement)
    }
  }
}

const getTeachers = teachers => Promise.all(teachers.map(t => Oodi.getTeacherInfo(t.teacher_id)))

const createTeachers = async (attainment, courseinstance) => {
  const teachers = await getTeachers(attainment.teachers)
  await Promise.all(teachers.map(teacher => Teacher.upsert(mapper.getTeacherFromData(teacher))))
  for (let teacher of teachers) {
    await TeacherService.createCourseTeacher(DEFAULT_TEACHER_ROLE, teacher, courseinstance)
  }
}

const attainmentAlreadyInDb = attainment => attainmentIds.has(String(attainment.studyattainment_id))

const createCourse = async course => {
  if (!courseIds.has(course.code)) {
    await Course.upsert(course)
    courseIds.add(course.code)
  }
}

const updateStudyattainments = async (api) => {
  for (let data of api.studyattainments) {
    const attainment = mapper.attainmentDataToCredit(data)
    if (!attainmentAlreadyInDb(attainment)) {
      await createCourse(mapper.attainmentDataToCourse(data))
      const [ courseinstance ] = await CourseInstance.upsert(
        mapper.attainmentDataToCourseInstance(data),
        { returning: true }
      )
      await Credit.upsert(mapper.attainmentDataToCredit(data, courseinstance.id))
      await createTeachers(data, courseinstance)
    }
  }
}

const updateStudentInformation = async (studentNumberList, startindex) => {
  let index = startindex
  for (let studentnumber of studentNumberList) {
    const api = await getAllStudentInformationFromApi(studentnumber)
    if (api.student === null || api.student === undefined) {
      logger.verbose(`API returned ${api.student} for studentnumber ${studentnumber}`)
    } else {
      await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
      await Promise.all([
        updateStudyrights(api),
        updateStudyattainments(api)
      ])
      index = index + 1
      logger.verbose(`Students updated: ${index}/${studentNumberList.length + startindex}.`)
    }
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
      logger.verbose(`Faculty ${faculty.code} already in in db.`)
      return
    }
    logger.verbose(`Faculty ${faculty.code} missing from db.`)
    await Organisation.upsert(mapper.getOrganisationFromData(faculty))

  }))
}

const updateStudents = async (studentnumbers, startindex = 0) => {
  await updateStudentInformation(studentnumbers.splice(startindex), startindex)
}

const existingStudyAttainmentIds = async () => {
  const attainments = await Credit.findAll()
  return new Set(attainments.map(attainment => attainment.id))
}

const existingCourseIds = async () => {
  const courses = await Course.findAll()
  return new Set(courses.map(course => course.code))
}

const existingElementIds = async () => {
  const elements = await ElementDetails.findAll()
  return new Set(elements.map(element => element.code))
}

const updateDatabase = async (studentnumbers) => {
  attainmentIds = await existingStudyAttainmentIds()
  courseIds = await existingCourseIds()
  elementDetailsIds = await existingElementIds()
  await updateFaculties()
  await updateStudents(studentnumbers)
}

module.exports = { updateDatabase, updateFaculties, updateStudents }