const oodilearnClient = require('./oodilearn_interface')
const studentService = require('./students')

const ping = oodilearnClient.ping

const matchingStudents = async searchTerm => {
  const students = await studentService.bySearchTerm(searchTerm)
  const snumbers = students.map(s => s.studentNumber)
  const profiles = await oodilearnClient.getStudents(snumbers)
  const matches = students
    .filter(s => !!profiles[s.studentNumber])
    .map(({ firstnames, lastname, studentNumber: studentnumber, name }) => ({
      firstnames,
      lastname,
      name,
      studentnumber,
      profile: profiles[studentnumber]
    }))
  return matches
} 

const getStudentData = studentnumber => oodilearnClient.getStudentData(studentnumber)

module.exports = {
  ping,
  getStudentData,
  matchingStudents
}