const Oodi = require('./oodi_interface')
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

const updateStudyattainments = async (api, studentnumber, onDemand) => {
  for (let data of api.studyattainments) {
    const attainment = mapper.attainmentDataToCredit(data)
    if (!attainmentAlreadyInDb(attainment)) {
      await createCourse(mapper.attainmentDataToCourse(data))
      const [courseinstance] = await CourseInstance.upsert(
        mapper.attainmentDataToCourseInstance(data),
        { returning: true }
      )
      await Credit.upsert(mapper.attainmentDataToCredit(data, courseinstance.id, studentnumber))
      if (!onDemand) {
        await createTeachers(data, courseinstance)
      }
    }
  }
}

const updateStudent = async (studentnumber, onDemand) => {
  console.log(`updating ${studentnumber}`)
  const api = await getAllStudentInformationFromApi(studentnumber)
  if (api.student === null || api.student === undefined) {
    logger.verbose(`API returned ${api.student} for studentnumber ${studentnumber}.    `)
  } else {
    await Student.upsert(mapper.getStudentFromData(api.student, api.studyrights))
    await Promise.all([
      updateStudyrights(api, studentnumber),
      updateStudyattainments(api, studentnumber, onDemand)
    ])
  }
}

const updateStudents = async (studentnumbers, onUpdateStudent, chunksize = 1, onDemand) => {
  const runOnUpdate = _.isFunction(onUpdateStudent)
  const remaining = studentnumbers.slice(0)
  console.log('updating')
  while (remaining.length > 0) {
    const nextchunk = remaining.splice(0, chunksize)
    await Promise.all(nextchunk.map(async studentnumber => {
      await updateStudent(studentnumber, onDemand)
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


const updateDatabase = async (studentnumbers, onUpdateStudent, onDemand = false) => {
  console.log('starting', studentnumbers.length)
  if (process.env.NODE_ENV !== 'anon') {
    await updateFaculties()
  }
  await updateStudents(studentnumbers, onUpdateStudent, 128, onDemand)
  return
}

module.exports = { updateDatabase, updateFaculties }