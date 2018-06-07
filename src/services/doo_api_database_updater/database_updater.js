const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const logger = require('../../util/logger')

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const updateStudentInformation = async studentNumberList => {
  await Promise.all(studentNumberList.map(updateAllDataRelatedToStudent))
}

const updateAllDataRelatedToStudent = async studentNumber => {
  const student = await loadAndUpdateStudent(studentNumber)

  if (student === null) {
    logger.error(`Can't get student ' + ${studentNumber}`)
    return
  }

}

const createNewStudent = async (studentFromApi, studentNumber) => {
  try {
    const studentFromDb = await StudentService.createStudent(studentFromApi)
    logger.verbose('Student ' + studentNumber + ' created to database')
    return studentFromDb
  } catch (e) {
    logger.error('Student ' + studentNumber + ': creation failed, error message:')
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

  } catch (e) {
    logger.error('Student: ' + studentNumber + ' loadAndUpdate failed')
  }
}

const run = async () => {
  // const studentList = ['014441008', '014420676', '014580736']
  await updateStudentInformation(['014028638'])
  process.exit(0)
}

run()