const moment = require('moment')
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
const { Course, CourseInstance, Unit } = require('../../models/index')
const _ = require('lodash')

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const DEFAULT_TEACHER_ROLE = 'Teacher'

const createExistingCourseMap = async () => {
  logger.verbose('Creating a set of existing course ids in the database.')
  const courses = await Course.all()
  const ids = courses.map(course => [course.code, course])
  return new Map(ids)
}

const uniqueIdForCourseInstance = ({ course_code, coursedate }) => `${course_code}_${coursedate}`

const createExistingCourseInstanceMap = async () => {
  logger.verbose('Creating a map of existing course instances in the database.')
  const courseinstances = await CourseInstance.all()
  const ids = courseinstances.map(courseinstance => [uniqueIdForCourseInstance(courseinstance), courseinstance])
  return new Map(ids)
}

const createExistingUnitSet = async () => {
  logger.verbose('Creating a set of existing unit ids in the database.')
  const units = await Unit.all()
  const names = units.map(unit => unit.name)
  return new Set(names)
}

const updateStudentInformation = async (studentNumberList, startindex) => {
  let index = startindex
  let courseMap = await createExistingCourseMap()
  let courseInstanceMap = await createExistingCourseInstanceMap()
  let unitNameSet = await createExistingUnitSet()
  for (let studentNumber of studentNumberList) {
    await updateAllDataRelatedToStudent(studentNumber, courseMap, courseInstanceMap, unitNameSet)
    index = index + 1
    logger.verbose(`Students updated: ${index}/${studentNumberList.length + startindex}.`)
  }
}

const getFaculties = () => {
  return Promise.all([OrganisationService.all(), Oodi.getFaculties()])
}

const saveFacultyToDb = async faculty => {
  try {
    await OrganisationService.createOrganisation(faculty)
    logger.verbose(`Faculty ${faculty.code} created.`)
  } catch (error) {
    logger.verbose(`Error creating faculty ${faculty.code}, error: ${error.message}`)
  }
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
    await saveFacultyToDb(faculty)
  }))
}

const getStudyAttainments = async student => {
  const { studentnumber } = student
  const dbAttainments = student.credits ? student.credits : []
  const apiAttainments = await Oodi.getStudyAttainments(studentnumber)
  return [dbAttainments, apiAttainments]
}

const saveStudyAttainment = async (attainment, studentNumber, courseInstanceId) => {
  const { id } = attainment
  try {
    await CreditService.createCreditFromAttainment(attainment, studentNumber, courseInstanceId)
    logger.verbose(`Study attainment ${id} created for student ${studentNumber} and course instance ${courseInstanceId}. `)
  } catch (error) {
    logger.error(`Creating study attainment ${id} failed: ${error.message}`)
    throw (error)
  }
}

const updateCourse = async (course, courseMap) => {
  const { code, name, latest_instance_date } = course
  const dbCourse = courseMap.get(code)
  if (dbCourse !== undefined) {
    logger.verbose(`Course ${code} already in in database.`)
    if (latest_instance_date > dbCourse.latest_instance_date) {
      logger.verbose(`Course ${code} has a newer instance date ${latest_instance_date}, updating course.`)
      dbCourse.latest_instance_date = latest_instance_date
      await dbCourse.save()
    }
    return
  }
  logger.verbose(`Creating course ${code} ${name}`)
  const newCourse = await CourseService.createCourse(code, name, latest_instance_date)
  courseMap.set(code, newCourse)
}

const updateCourseInstance = async (courseInstance, courseInstanceMap) => {
  const { coursedate, course_code } = courseInstance
  const identifier = uniqueIdForCourseInstance(courseInstance)
  const dbCourseInstance = courseInstanceMap.get(identifier)
  if (dbCourseInstance !== undefined) {
    logger.verbose(`Course instance for ${course_code} for date ${coursedate} already in database.`)
    return dbCourseInstance
  }
  logger.verbose(`Course instance ${course_code} for date ${coursedate} not in database.`)
  const newCourseInstance = await CourseService.createCourseInstance(coursedate, course_code)
  courseInstanceMap.set(identifier, newCourseInstance)
  return newCourseInstance
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
      logger.verbose(`Teacher ${id} created.`)
    } catch (error) {
      logger.error(`Error creating teacher ${id}: ${error.message}`)
      throw (error)
    }
  }))
  return dbTeachers
}

const updateCourseTeacher = async (teachers, courseinstance) => {
  for (let teacher of teachers) {
    await TeacherService.createCourseTeacher(DEFAULT_TEACHER_ROLE, teacher, courseinstance)
  }
}

const updateStudyAttainment = async (apiAttainment, studentnumber, courseMap, courseInstanceMap) => {
  const [credit, course, courseInstance] = datamapper.studyAttainmentDataToModels(apiAttainment)
  await updateCourse(course, courseMap)
  const courseinstance = await updateCourseInstance(courseInstance, courseInstanceMap)
  const teachers = await updateTeachers(apiAttainment.teachers)
  await updateCourseTeacher(teachers, courseinstance)
  await saveStudyAttainment(credit, studentnumber, courseinstance.id)
}

const updateStudentStudyAttainments = async (student, courseMap, courseInstanceMap) => {
  const { studentnumber } = student
  logger.verbose(`Updating student credits for student ${studentnumber}`)
  const [dbAttainments, apiAttainments] = await getStudyAttainments(student)
  const dbAttainmentIds = new Set(dbAttainments.map(attainment => Number(attainment.id)))
  for (let apiAttainment of apiAttainments) {
    const { studyattainment_id } = apiAttainment
    if (dbAttainmentIds.has(studyattainment_id)) {
      logger.verbose(`Study attainment ${studyattainment_id} already in database.`)
      continue
    }
    logger.verbose(`Study attainment ${studyattainment_id} not in database.`)
    await updateStudyAttainment(apiAttainment, studentnumber, courseMap, courseInstanceMap)
    dbAttainmentIds.add(studyattainment_id)
  }
}

const updateAllDataRelatedToStudent = async (studentNumber, courseMap, courseInstanceMap, unitNameSet) => {
  const student = await loadAndUpdateStudent(studentNumber)

  if (!student) {
    logger.error(`Can't get student ${studentNumber}`)
    return
  }

  await Promise.all([
    updateStudentStudyRights(student, unitNameSet),
    updateStudentStudyAttainments(student, courseMap, courseInstanceMap)
  ])
}

const getStudyRights = async (studentnumber) => await Promise.all([
  Oodi.getStudentStudyRights(studentnumber),
  StudyrightService.byStudent(studentnumber)
])

const createUnit = async (name, unitNameSet) => {
  if (unitNameSet.has(name)) {
    logger.verbose(`Unit ${name} already exists. `)
    return
  }
  logger.verbose(`Creating new unit ${name}`)
  await UnitService.createUnit({
    name,
    enabled: true
  })
  unitNameSet.add(name)
}

const createNewStudyright = async (studyRight, unitNameSet) => {
  await createUnit(studyRight.highlevelname, unitNameSet)
  await StudyrightService.createStudyright(studyRight)
}

const updateExistingStudyright = async (apiStudyright, dbStudyright) => {
  const studyrightHasNotChanged = _.isEqual(apiStudyright, dbStudyright.dataValues)
  if (studyrightHasNotChanged) {
    logger.verbose(`Studyright ${apiStudyright.studyrightid} already up to date in database.`)
  } else {
    logger.verbose(`Studyright ${apiStudyright.studyrightid} requires update.`)
    await dbStudyright.update(apiStudyright)
  }
}

const universityEnrollmentDateFromStudyRights = studyRightArray => {
  return _.sortBy(studyRightArray.map(s => s.startdate), n =>
    moment(n).valueOf())[0]
} 

const updateStudentStudyRights = async (student, unitNameSet) => {
  const { studentnumber } = student
  const [apiStudyRightArray, dbStudyRightArray] = await getStudyRights(studentnumber)
  const dbStudyRights = new Map(dbStudyRightArray.map(sr => [sr.studyrightid, sr]))
  await student.update({ 
    dateofuniversityenrollment: universityEnrollmentDateFromStudyRights(apiStudyRightArray)
  })
  for (let apiStudyRight of apiStudyRightArray) {
    const { studyrightid } = apiStudyRight

    if (dbStudyRights.has(studyrightid)) {
      logger.verbose(`Studyright ${studyrightid} found in database, checking for updated values.`)
      const dbStudyRight = dbStudyRights.get(studyrightid)
      await updateExistingStudyright(apiStudyRight, dbStudyRight)
    } else {
      logger.verbose(`Studyright ${studyrightid} not included in database.`)
      await createNewStudyright(apiStudyRight, unitNameSet)
    }
  }
}

const createNewStudent = async (studentFromApi, studentNumber) => {
  try {
    const studentFromDb = await StudentService.createStudent(studentFromApi)
    logger.verbose(`Student ${studentNumber} created to database.`)
    return studentFromDb
  } catch (e) {
    logger.error(`Student ${studentNumber} : creation failed, error message: ${e.message}`)
    return null
  }
}

const getStudent = studentNumber => Promise.all([StudentService.byId(studentNumber), Oodi.getStudent(studentNumber)])

const loadAndUpdateStudent = async studentNumber => {
  try {
    let [studentFromDb, studentFromApi] = await getStudent(studentNumber)
    if (studentFromApi === null) {
      logger.verbose(`Student ${studentNumber} returned null from the api.`)
      return studentFromDb
    } else if (studentFromDb === null) {
      logger.verbose(`Student ${studentNumber} found in api but not in db.`)
      return await createNewStudent(studentFromApi, studentNumber)
    } else {
      logger.verbose(`Student ${studentNumber} found in api and db, updating values.`)
      await studentFromDb.update(studentFromApi)
      return studentFromDb
    }
  } catch (e) {
    logger.error(`Student: ${studentNumber} loadAndUpdate failed.`)
    throw (e)
  }
}

const updateDatabaseForStudents = async (studentnumbers, startindex = 0) => {
  await updateFaculties()
  await updateStudentInformation(studentnumbers.splice(startindex), startindex)
}

const updateDatabase = async (studentnumbers, startindex = 0) => {
  await updateDatabaseForStudents(studentnumbers, startindex)
}

module.exports = { updateDatabase, updateFaculties }