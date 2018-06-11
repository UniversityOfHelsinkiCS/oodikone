const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const UnitService = require('../units')
const OrganisationService = require('../organisations')
const CreditService = require('../credits')
const CourseService = require('../courses')
const logger = require('../../util/logger')
const datamapper = require('./oodi_data_mapper')

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const ELEMENT_ID = {
  DEGREE_TITLE: 10,
  DEGREE_MAJOR: 40
} 

const highlevelnameFromElements = elements => {
  let degree, subject
  elements.forEach(element => {
    const name = element.name[2].text
    switch(element.element_id) {
    case ELEMENT_ID.DEGREE_TITLE:
      degree = name
      break
    case ELEMENT_ID.DEGREE_MAJOR:
      subject = name
      break
    default:
      break
    }
  })
  return `${degree}, ${subject}`
}

const updateStudentInformation = async studentNumberList => {
  await Promise.all(studentNumberList.map(updateAllDataRelatedToStudent))
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

const updateStudyAttainment = async (apiAttainment, studentnumber) => {
  const [ credit, course, courseInstance ] = datamapper.studyAttainmentDataToModels(apiAttainment)
  await updateCourse(course)
  const { id } = await updateCourseInstance(courseInstance)
  await saveStudyAttainment(credit, studentnumber, id)
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

const saveStudyRight = async (studyRight, studentNumber) => {
  try {
    await StudyrightService.createStudyright(studyRight, studentNumber)
    logger.verbose(`Student ${studentNumber}: new studyright created`)
  } catch (e) {
    logger.error(`Student ${studentNumber}: creating studyright failed: ${e.message} `)
    throw(e)
  }
}

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

const updateStudyright = async (studyRight, studentnumber) => {
  const highlevelname = highlevelnameFromElements(studyRight.elements)
  await createUnit(highlevelname)
  await saveStudyRight(studyRight, studentnumber, highlevelname)
}

const updateStudentStudyRights = async student => {
  const { studentnumber } = student
  const [ apiStudyRightArray, dbStudyRightArray ] = await getStudyRights(studentnumber)
  const dbStudyRightIds = new Set(dbStudyRightArray.map(studyright => studyright.studyrightid))
  await Promise.all(apiStudyRightArray.map(async studyRight => {
    const id = `${studyRight.studyright_id}`
    if (dbStudyRightIds.has(id)) {
      logger.verbose(`Studyright ${id} already in database. `)
      return
    }
    logger.verbose(`Studyright ${id} not included in database. `)
    await updateStudyright(studyRight, studentnumber)
  }))
}

const createNewStudent = async (studentFromApi, studentNumber) => {
  try {
    const studentFromDb = await StudentService.createStudent(studentFromApi)
    logger.verbose(`Student ${studentNumber} created to database`)
    return studentFromDb
  } catch (e) {
    logger.error(`Student ${studentNumber} : creation failed, error message:`)
    return null
  }

}

const apiHasNewCreditsForStudent = (studentFromDb, studentFromApi) => {
  const { studyattainments } = studentFromApi
  const { creditcount } = studentFromDb
  return studyattainments && (studyattainments > creditcount)
}

const loadAndUpdateStudent = async studentNumber => {
  try {
    let [ studentFromDb, studentFromApi ] = await Promise.all([StudentService.byId(studentNumber), Oodi.getStudent(studentNumber)])

    if (studentFromApi === null) {
      logger.verbose(`API returned null for student ${studentNumber}`)
      return null
    }
    if (studentFromDb === null) {
      return await createNewStudent(studentFromApi, studentNumber)
    }

    const studentRequiresUpdate = apiHasNewCreditsForStudent(studentFromDb, studentFromApi)
    if (!studentRequiresUpdate) {
      logger.verbose(`Student ${studentNumber} already up to date.`)
      return studentFromDb
    }

    try {
      await StudentService.updateStudent(studentFromApi)
      logger.verbose(`Student ${studentNumber} details updated. `)
    } catch (e) {
      logger.error(`Student ${studentNumber} update failed. `)
    }

    return studentFromDb
  } catch (e) {
    logger.error(`Student: ${studentNumber} loadAndUpdate failed`)
    throw(e)
  }
}

const run = async () => {
  const { STUDENT_NUMBERS } = process.env
  const studentNumbers = STUDENT_NUMBERS ? STUDENT_NUMBERS.split(' ') : []
  await updateFaculties()  
  await updateStudentInformation(studentNumbers)
  process.exit(0)
}

run()