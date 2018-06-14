const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const UnitService = require('../units')
const OrganisationService = require('../organisations')
const CreditService = require('../credits')
const CourseService = require('../courses')
const TeacherService = require('../teachers')
const logger = require('../../util/logger')
const datamapper = require('./oodi_data_mapper')
const fs = require('fs')
const _ = require('lodash')

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const DEFAULT_TEACHER_ROLE = 'Teacher'

const updateStudentInformation = async (studentNumberList, startindex) => {
  let index = startindex
  for (let studentNumber of studentNumberList) {
    logger.verbose(`Students updated: ${index}/${studentNumberList.length}. `)
    await updateAllDataRelatedToStudent(studentNumber)
    index = index + 1
  }
}

const getFaculties = () => {
  return Promise.all([OrganisationService.all(), Oodi.getFaculties()])
}

const saveFacultyToDb = async faculty => {
  try {
    await OrganisationService.createOrganisation(faculty)
    logger.verbose(`Faculty ${faculty.code} created. `)    
  } catch (error) {
    logger.verbose(`Error creating faculty ${faculty.code}, error: ${error.message}`)
  }
}

const updateFaculties = async () => {
  const [ dbFacultiesArray, apiFacultiesArray ] = await getFaculties()
  const dbFacultyCodes = new Set(dbFacultiesArray.map(faculty => faculty.code))
  await Promise.all(apiFacultiesArray.map(async faculty => {
    if (dbFacultyCodes.has(faculty.code)) {
      logger.verbose(`Faculty ${faculty.code} already in in db.`)
      return
    }
    logger.verbose(`Faculty ${faculty.code} missing from db`)
    await saveFacultyToDb(faculty)
  }))
}

const getStudyAttainments = async student => {
  const { studentnumber } = student
  const dbAttainments = student.credits ? student.credits : []
  const apiAttainments  = await Oodi.getStudyAttainments(studentnumber)
  return [ dbAttainments, apiAttainments ]
}

const saveStudyAttainment = async (attainment, studentNumber, courseInstanceId) => {
  const { id } = attainment
  try {
    await CreditService.createCreditFromAttainment(attainment, studentNumber, courseInstanceId)
    logger.verbose(`Study attainment ${id} created. `)
  } catch (error) {
    logger.error(`Creating study attainment ${id} failed: ${error.message}`)
    throw(error)
  }
}

const updateCourse = async course => {
  const { code, name } = course
  const dbCourse = await CourseService.byCode(code)
  if (dbCourse !== null) {
    logger.verbose(`Course ${code} already already in in database`)
    return
  }
  logger.verbose(`Creating course ${code} ${name}`)
  await CourseService.createCourse(code, name)
}

const updateCourseInstance = async courseInstance => {
  const { coursedate, course_code } = courseInstance
  const dbCourseInstance = await CourseService.courseInstanceByCodeAndDate(course_code, coursedate)
  if (dbCourseInstance !== null) {
    logger.verbose(`Course instance for ${course_code} for date ${coursedate} already in database`)
    return dbCourseInstance
  }
  logger.verbose(`Course instance ${course_code} for date ${coursedate} not in database`)
  return await CourseService.createCourseInstance(coursedate, course_code)
}

const updateTeachers = async teachers => {
  const apiIds = teachers.map(teacher => teacher.teacher_id)
  const dbTeachers = await TeacherService.teachersByIds(apiIds)
  const dbIds = dbTeachers.map(teacher => teacher.id)
  const newTeacherIds = _.difference(apiIds, dbIds)
  await Promise.all(newTeacherIds.map(async id => {
    try {
      const apiTeacher = await Oodi.getTeacherInfo(id)
      const dbTeacher = await TeacherService.createTeacherFromObject(apiTeacher)
      dbTeachers.push(dbTeacher)
      logger.verbose(`Teacher ${id} created`)
    } catch (error) {
      logger.error(`Error creating teacher ${id}: ${error.message}`)
      throw(error)
    }
  }))
  return dbTeachers
}

const updateCourseTeacher = async (teachers, courseinstance) => {
  for (let teacher of teachers) {
    await TeacherService.createCourseTeacher(DEFAULT_TEACHER_ROLE, teacher, courseinstance)    
  }
}

const updateStudyAttainment = async (apiAttainment, studentnumber) => {
  const [ credit, course, courseInstance ] = datamapper.studyAttainmentDataToModels(apiAttainment)
  await updateCourse(course)
  const courseinstance = await updateCourseInstance(courseInstance)
  const teachers = await updateTeachers(apiAttainment.teachers)
  await updateCourseTeacher(teachers, courseinstance)
  await saveStudyAttainment(credit, studentnumber, courseinstance.id)
}

const updateStudentStudyAttainments = async student => {
  const { studentnumber } = student
  logger.verbose(`Updating student credits for student ${studentnumber}`)
  const [ dbAttainments, apiAttainments ] = await getStudyAttainments(student)
  const dbAttainmentIds = new Set(dbAttainments.map(attainment => Number(attainment.id)))
  for (let apiAttainment of apiAttainments) {
    const { studyattainment_id } = apiAttainment
    if (dbAttainmentIds.has(studyattainment_id)) {
      logger.verbose(`Study attainment ${studyattainment_id} already in database`)
      continue
    }
    logger.verbose(`Study attainment ${studyattainment_id} not in database`)
    await updateStudyAttainment(apiAttainment, studentnumber)
    dbAttainmentIds.add(studyattainment_id)
  }
}

const updateAllDataRelatedToStudent = async studentNumber => {
  const student = await loadAndUpdateStudent(studentNumber)

  if (!student) {
    logger.error(`Can't get student ${studentNumber}`)
    return
  }

  await Promise.all([
    updateStudentStudyRights(student),
    updateStudentStudyAttainments(student)
  ])
}

const getStudyRights = async (studentnumber) => await Promise.all([
  Oodi.getStudentStudyRights(studentnumber),
  StudyrightService.byStudent(studentnumber)
])

const createUnit = async (name) => {
  const unit = await UnitService.findByName(name)
  if (unit !== null) {
    logger.verbose(`Unit ${name} already exists. `)
    return
  }
  logger.verbose(`Creating new unit ${name}`)
  await UnitService.createUnit({
    name,
    enabled: true
  })
}

const createNewStudyright = async (studyRight) => {
  await createUnit(studyRight.highlevelname)
  await StudyrightService.createStudyright(studyRight)
}

const updateExistingStudyright = async (apiStudyright, dbStudyright) => {
  const studyrightHasNotChanged = _.isEqual(apiStudyright, dbStudyright.dataValues)
  if (studyrightHasNotChanged) {
    logger.verbose(`Studyright ${apiStudyright.studyrightid} already up to date in database`)
  } else {
    logger.verbose(`Studyright ${apiStudyright.studyrightid} requires update`)
    await dbStudyright.update(apiStudyright)
  }
}

const updateStudentStudyRights = async student => {
  const { studentnumber } = student
  const [ apiStudyRightArray, dbStudyRightArray ] = await getStudyRights(studentnumber)
  const dbStudyRights = new Map(dbStudyRightArray.map(sr => [sr.studyrightid, sr]))
  for (let apiStudyRight of apiStudyRightArray) {
    const { studyrightid } = apiStudyRight
    if (dbStudyRights.has(studyrightid)) {
      logger.verbose(`Studyright ${studyrightid} found in database, checking for updated values. `)
      const dbStudyRight = dbStudyRights.get(studyrightid)
      await updateExistingStudyright(apiStudyRight, dbStudyRight)
    } else {
      logger.verbose(`Studyright ${studyrightid} not included in database. `)
      await createNewStudyright(apiStudyRight)
    }
  }
}

const createNewStudent = async (studentFromApi, studentNumber) => {
  try {
    const studentFromDb = await StudentService.createStudent(studentFromApi)
    logger.verbose(`Student ${studentNumber} created to database`)
    return studentFromDb
  } catch (e) {
    logger.error(`Student ${studentNumber} : creation failed, error message: ${e.message}`)
    return null
  }
}

const getStudent = studentNumber => Promise.all([StudentService.byId(studentNumber), Oodi.getStudent(studentNumber)])

const loadAndUpdateStudent = async studentNumber => {
  try {
    let [ studentFromDb, studentFromApi ] = await getStudent(studentNumber)
    if (studentFromApi === null) {
      logger.verbose(`Student ${studentNumber} returned null from the api`)
      return studentFromDb
    } else if (studentFromDb === null) {
      logger.verbose(`Student ${studentNumber} found in api but not in db`)
      return await createNewStudent(studentFromApi, studentNumber)
    } else {
      logger.verbose(`Student ${studentNumber} found in api and db, updating values.`)
      await StudentService.updateStudent(studentFromApi)
      return studentFromDb
    }
  } catch (e) {
    logger.error(`Student: ${studentNumber} loadAndUpdate failed.`)
    throw(e)
  }
}

const updateDatabaseForStudents = async (studentnumbers, startindex=0) => {
  await updateFaculties()
  await updateStudentInformation(studentnumbers.splice(startindex), startindex)
}

const run = async () => {
  const studentnumbers = fs.readFileSync('studentnumbers.txt', 'utf-8').split('\n').map(s => s.replace(' ',''))
  await updateDatabaseForStudents(studentnumbers)
  process.exit(0)
}

run()