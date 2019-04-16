const Sequelize = require('sequelize')
const oodilearnClient = require('./oodilearn_interface')
const studentService = require('./students')
const { Credit, Student, Course } = require('../models')
const Op = Sequelize.Op

const defaultName = nameObj => nameObj['en'] || nameObj['fi'] || Object.values(nameObj)[0]

const formatStudentNumber = studentnumber => {
  const snum = studentnumber.toString()
  return snum.startsWith('0') ? snum : `0${snum}`
}

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

const getStudentCredits = studentnumbers => Student.findAll({
  attributes: ['studentnumber'],
  include: {
    model: Credit,
    attributes: ['grade', 'credits'],
    required: true,
    include: {
      model: Course,
      attributes: ['name', 'code'],
      where: {
        is_study_module: false
      }
    }
  },
  where: {
    studentnumber: {
      [Op.in]: studentnumbers
    }
  }
})

const courseGradeData = async (courseCode) => {
  const credits = await getCourseStudents(courseCode)
  const courseGrades = {}
  credits.map(credit => courseGrades[credit.grade] ? courseGrades[credit.grade].push(credit.student_studentnumber) : courseGrades[credit.grade] = [credit.student_studentnumber])
  const { data } = await oodilearnClient.getCourseData(courseGrades)
  return data
}
const getCluster = async (courseCode) =>  oodilearnClient.getCluster(courseCode)

const getStudentData = studentnumber => oodilearnClient.getStudentData(studentnumber)

const getPopulation = async population => {
  const { data } = await oodilearnClient.getPopulationData(population)
  const { dimensions } = data
  const students = {}
  const courses = {}
  data.students.forEach(({ studentnumber: snum, ...rest }) => {
    const studentnumber = formatStudentNumber(snum)
    students[studentnumber] = { studentnumber, ...rest }
  })
  const studentcredits = await getStudentCredits(Object.keys(students))
  const aggregate = studentcredits.map(({ studentnumber, credits }) => {
    credits.forEach(({ course }) => {
      courses[course.code] = course.name
    })
    return {
      ...students[studentnumber],
      studentnumber,
      credits
    }
  })
  return {
    students: aggregate,
    categories: dimensions,
    courses: Object.entries(courses).map(([code, name]) => ({
      code,
      value: code,
      text: defaultName(name),
      names: name
    }))
  }
}

const suggestCourse = (doneCourses, period) => oodilearnClient.getCourseSuggestion(doneCourses, period)

const suggestRoute = () => oodilearnClient.getRouteSuggestion()

const getPopulations = async () => {
  const { data } = await oodilearnClient.getPopulations()
  return data
}

module.exports = {
  ping,
  query,
  getStudentData,
  matchingStudents,
  courseGradeData,
  getCluster,
  getPopulation,
  suggestCourse,
  suggestRoute,
  getPopulations
}
