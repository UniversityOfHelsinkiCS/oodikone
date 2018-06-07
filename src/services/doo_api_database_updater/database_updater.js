const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
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

  await updateStudentStudyRights(student)

}

const getStudyRights = async (studentnumber) => await Promise.all([
  Oodi.getStudentStudyRights(studentnumber),
  StudyrightService.byStudent(studentnumber)
])

const saveStudyRight = async studyRight => {
  logger.verbose(`Saving studyright ${studyRight.studyright_id}`)
}

const studyrightArrayToObjectById = (array) => array.reduce((obj, studyright) => {
  obj[studyright.studyright_id] = studyright
  return obj
}, {})

const updateStudentStudyRights = async student => {
  try {
    const [ apiStudyRightArray, dbStudyRightArray ] = await getStudyRights(student.studentnumber)
    const dbStudyRightSet = studyrightArrayToObjectById(dbStudyRightArray)
    await Promise.all(apiStudyRightArray.map(async studyRight => {
      const id = studyRight.studyright_id
      if (dbStudyRightSet[id] !== undefined) {
        logger.verbose(`Studyright ${id} already in database. `)
        return
      }
      logger.verbose(`Studyright ${id} not included in database. `)
      await saveStudyRight(studyRight)
    }))
  } catch (e) {
    logger.error(`Updating student studyrights failed for student ${student.studentnumber}`)
  }
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
  }
}

const run = async () => {
  const { STUDENT_NUMBERS } = process.env
  const studentNumbers = STUDENT_NUMBERS ? STUDENT_NUMBERS.split(' ') : []
  await updateStudentInformation(studentNumbers)
  process.exit(0)
}

run()