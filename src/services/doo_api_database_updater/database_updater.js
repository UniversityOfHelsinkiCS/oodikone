const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const UnitService = require('../units')
const logger = require('../../util/logger')

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

const updateAllDataRelatedToStudent = async studentNumber => {
  const student = await loadAndUpdateStudent(studentNumber)

  if (!student) {
    logger.error(`Can't get student ${studentNumber}`)
    return
  }

  await updateStudentStudyRights(student)
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

const reduceArrayToObjectByKey = (array, keyAttribute) => array.reduce((obj, studyright) => {
  const data = studyright.dataValues
  const key = data[keyAttribute]
  obj[key] = data
  return obj
}, {})

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

const updateStudyrightIfNotInDb = async (studyRight, dbDataSet, studentnumber) => {
  const { studyright_id, elements } = studyRight
  const studyRightAlreadyInDb = dbDataSet[studyright_id] !== undefined
  if (studyRightAlreadyInDb) {
    logger.verbose(`Studyright ${studyright_id} already in database. `)
    return
  }
  logger.verbose(`Studyright ${studyright_id} not included in database. `)
  const highlevelname = highlevelnameFromElements(elements)
  await createUnit(highlevelname)
  await saveStudyRight(studyRight, studentnumber, highlevelname)
}

const updateStudentStudyRights = async student => {
  const { studentnumber } = student
  const [ apiStudyRightArray, dbStudyRightArray ] = await getStudyRights(studentnumber)
  const dbStudyRightSet = reduceArrayToObjectByKey(dbStudyRightArray, 'studyrightid')
  await Promise.all(apiStudyRightArray.map(studyRight => updateStudyrightIfNotInDb(studyRight, dbStudyRightSet, studentnumber)))
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
  await updateStudentInformation(studentNumbers)
  process.exit(0)
}

run()