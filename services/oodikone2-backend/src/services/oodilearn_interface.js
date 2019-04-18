const axios = require('axios')
const https = require('https')
const { OODILEARN_URL } = require('../conf-backend')

const instance = axios.create({
  baseURL: OODILEARN_URL,
  httpsAgent: new https.Agent({ rejectUnauthorized: false })
})

const ping = () => instance.get('/ping')

const query = query => instance.get(query)

const getStudentData = studentnumber => instance.get(`/student/${studentnumber}`)

const getStudentsData = studentnumbers => instance.get('/students/',{ params: { 'student': studentnumbers } })

const getCourseData = gradeStudents => instance.get('/averages/',{ params: gradeStudents })

const getStudents = async numbers => {
  console.log(numbers)
  const request = await getStudentsData(numbers)
  const datas = request.data
  console.log(datas)
  const students = {}
  datas.forEach((student) => {
    const formattedStudent = { ...student, studentnumber: `0${student.Opiskelijanumero}` }
    delete formattedStudent.Opiskelijanumero
    students[formattedStudent.studentnumber] = formattedStudent
  })
  return students
}
const getCluster = (code) => instance.get(`/${code}`)

const getPopulationData = population => instance.get(`/groups/${population}`)

const getCourseSuggestion = (doneCourses, period) => instance.get('suggest_new_course', { params: { 'doneCourses': doneCourses, 'period': period } })

const getRouteSuggestion = () => instance.get('suggest_route_to_graduation')

const getPopulations = () => instance.get('/populations/')

module.exports = {
  ping,
  query,
  getStudentData,
  getStudents,
  getCourseData,
  getCluster,
  getPopulationData,
  getCourseSuggestion,
  getRouteSuggestion,
  getPopulations
}