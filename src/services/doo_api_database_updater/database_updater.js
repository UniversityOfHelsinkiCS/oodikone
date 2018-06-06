const Oodi = require('./oodi_interface')
const StudentService = require('../students')
const logger = require('../../util/logger')

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const updateStudentInformation = async studentList => {
  await Promise.all(studentList.map(student => loadAndUpdateStudent(student)))
} 

const loadAndUpdateStudent = async studentNumber => {
  try {
    let [ studentFromDb, studentFromApi ] = await Promise.all([StudentService.byId(studentNumber), Oodi.getStudent(studentNumber)
    ])
    
    if (studentFromApi === null) {
      return null
    }

    if (studentFromDb === null) {
      try {
        studentFromDb = await StudentService.createStudent(studentFromApi)
        logger.verbose('Student ' + studentNumber + ' created to database')
        return [studentFromDb, studentFromApi]
      } catch (e) {
        logger.error('Student ' + studentNumber + ': creation failed, error message:')
        return null
      }
    }
  } catch (e) {
    logger.error('Student: ' + studentNumber + ' loadAndUpdate failed')
  }
}

const run = async () => {
  const studentList = ['014441008', '014420676', '014580736']
  await updateStudentInformation(studentList)
  process.exit(0)
}

run()