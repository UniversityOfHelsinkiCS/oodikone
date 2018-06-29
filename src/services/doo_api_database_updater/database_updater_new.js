const Oodi = require('./oodi_interface_new')
const OrganisationService = require('../organisations')
const logger = require('../../util/logger')
const mapper = require('./oodi_data_mapper')
const { Student, Studyright, ElementDetails, StudyrightElement, Credit, Course, CourseInstance, Teacher, Organisation, CourseTeacher } = require('../../../src/models/index')
const _ = require('lodash')

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
    studyattainments,
    studentnumber
  }
}

const updateStudyrights = async (api, studentnumber) => {
  for (let data of api.studyrights) {
    const [ studyright ] = await Studyright.upsert(mapper.getStudyRightFromData(data, studentnumber), { returning: true })
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

const getTeachers = teachers => Promise.all(teachers.map(t => Oodi.getTeacherInfo(t.teacher_id)))

const createTeachers = async (attainment, courseinstance) => {
  const teachers = await getTeachers(attainment.teachers)
  await Promise.all(teachers.map(teacher => Teacher.upsert(mapper.getTeacherFromData(teacher))))
  await Promise.all(teachers.map(teacher => CourseTeacher.upsert(mapper.courseTeacherFromData(teacher, courseinstance.id))))
}

const attainmentAlreadyInDb = attainment => attainmentIds.has(String(attainment.studyattainment_id))

const createCourse = async course => {
  if (!courseIds.has(course.code)) {
    await Course.upsert(course)
    courseIds.add(course.code)
  }
}

const updateStudyattainments = async (api, studentnumber) => {
  for (let data of api.studyattainments) {
    const attainment = mapper.attainmentDataToCredit(data)
    if (!attainmentAlreadyInDb(attainment)) {
      await createCourse(mapper.attainmentDataToCourse(data))
      const [ courseinstance ] = await CourseInstance.upsert(
        mapper.attainmentDataToCourseInstance(data),
        { returning: true }
      )
      await Credit.upsert(mapper.attainmentDataToCredit(data, courseinstance.id, studentnumber))
      await createTeachers(data, courseinstance)
    }
  }
}

const updateStudent = async studentnumber => {
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

const updateStudents = async (studentnumbers, onUpdateStudent, chunksize = 1) => {
  const runOnUpdate = _.isFunction(onUpdateStudent)
  const remaining = studentnumbers.slice(0)
  while (remaining.length > 0) {
    const nextchunk = remaining.splice(0, chunksize)
    await Promise.all(nextchunk.map(async studentnumber => {
      await updateStudent(studentnumber)
      if(runOnUpdate) {
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

const updateDatabase = async (studentnumbers, onUpdateStudent) => {
  attainmentIds = await existingStudyAttainmentIds()
  courseIds = await existingCourseIds()
  elementDetailsIds = await existingElementIds()
  await updateFaculties()
  await updateStudents(studentnumbers, onUpdateStudent, 100)
}

module.exports = { updateDatabase, updateFaculties }