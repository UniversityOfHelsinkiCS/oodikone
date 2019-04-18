const fs = require('fs')
const { Student } = require('../../models/index')

const getStudentNumbers = async (writefilepath='./studentnumbers.txt') => {
  const file = fs.openSync(writefilepath, 'w')
  const students = await Student.findAll()
  for (let student of students) {
    const data = `${student.studentnumber} \n`
    fs.appendFileSync(file, data)
  }
  fs.closeSync(file)
  process.exit(0)
}

getStudentNumbers()