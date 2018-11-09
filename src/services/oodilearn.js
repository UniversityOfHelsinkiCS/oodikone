const oodilearnClient = require('./oodilearn_interface')
const studentService = require('./students')
const { Credit, Student } = require('../models')

const ping = oodilearnClient.ping

const query = oodilearnClient.query

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

const getCourseStudents = code => Credit.findAll({
  include: [
    {
      model: Student,
      attributes: ['studentnumber'],
      unique: true
    }],
  where: {
    course_code: code
  }
})

const courseGradeData = async (courseCode) => {
  const credits = await getCourseStudents(courseCode)
  // console.log('this many', credits.filter(s => allStudentNumbers.includes(s.student_studentnumber)).length)
  const courseGrades = {}
  credits.map(credit => courseGrades[credit.grade] ? courseGrades[credit.grade].push(credit.student_studentnumber) : courseGrades[credit.grade] = [credit.student_studentnumber])
  // console.log(courseGrades)
  const { data } = await oodilearnClient.getCourseData(courseGrades)
  // console.log(data.data)
  return data
}
const getCluster = async (courseCode) =>  oodilearnClient.getCluster(courseCode)


const getStudentData = studentnumber => oodilearnClient.getStudentData(studentnumber)

module.exports = {
  ping,
  query,
  getStudentData,
  matchingStudents,
  courseGradeData,
  getCluster
}
