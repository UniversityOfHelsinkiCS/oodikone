const Oodi = require('./oodi_interface')
const StudentService = require('./students')
const logger = require('../../util/logger')

process.on('unhandledRejection', (reason) => {
  console.log(reason)
})

const updateStudentInformation = async studentList => {
  const students = await (studentList.map(student => loadAndUpdateStudent(student)))
}
const loadAndUpdateStudent = async studentNumber => {
  try {
    let [ student, studentFromOodi ] = await Promise.all([StudentService.byId(studentNumber), Oodi.getStudent(studentNumber)
    ])
    
    if (studentFromOodi === null) {
      return null
    }

    if (student === null) {
      try {
        student = await StudentService.createStudent(studentFromOodi)
        logger.verbose('Student ' + studentNumber + ' created to database')
        console.log(student)
        return [student, studentFromOodi]
      } catch (e) {
        logger.error('Student ' + studentNumber + ': creation failed, error message:')
        return null
      }
    }

  //   const oodiLastCreditDate = studentFromOodi[21] !== null ?
  //     getDate(studentFromOodi[21], 'DD.MM.YYYY') : null

  //   if (oodiLastCreditDate === null ||
  //     oodiLastCreditDate === getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD')) {
  //     return student
  //   }

  //   try {
  //     await StudentService.updateStudent(studentFromOodi)
  //     logger.verbose('Student ' + studentNumber + ': details updated')
  //   } catch (e) {
  //     logger.error('Student ' + studentNumber + ': update failed')
  //   }

  //   return student
  } catch (e) {
  //   logger.error('Student: ' + studentNumber + ' loadAndUpdate failed')
  // }
  }
}

const run = async () => {
  const studentList = ['014441008', '014420676', '014580736']
  const [studyrights, credits] = await updateStudentInformation(studentList)

  process.exit(0)
}

run()