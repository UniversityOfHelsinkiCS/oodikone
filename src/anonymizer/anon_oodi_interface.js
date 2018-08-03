const axios = require('axios')
const https = require('https')
require('dotenv').config()


const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

axios.defaults.auth = {
  username: 'tktl',
}

axios.defaults.params = {
  token: process.env.TOKEN
}

const getStudent = (studentNumber) => {
  return instance.get(`${process.env.OODI_ADDR}/students/${studentNumber}/info`)
    .then(response => {
      return response.data.data
    })
    .catch(error => {
      return error
    })
}
const getStudyAttainments = async studentNumber => {
  const url = `${process.env.OODI_ADDR}/students/${studentNumber}/studyattainments`
  const response = await instance.get(url)
  return response.data.data
}
const getTeacher = async teacherId => {
  const url = `${process.env.OODI_ADDR}/teachers/${teacherId}/info`
  const response = await instance.get(url)
  return response.data.data
}
const getStudyRights = async studentNumber => {
  const url = `${process.env.OODI_ADDR}/students/${studentNumber}/studyrights`
  const response = await instance.get(url)
  return response.data.data
}
const getCourseTypeCodes = async () => {
  const url = `${process.env.OODI_ADDR}/codes/learningopportunities/types`
  const response = await instance.get(url)
  return response.data.data
}

const getStudyattainmentStatusCodes = async () => {
  const url = `${process.env.OODI_ADDR}/codes/studyattainments/statuses`
  const response = await instance.get(url)
  return response.data.data
}


const getSemesters = async () => {
  const url = `${process.env.OODI_ADDR}/codes/semesters`
  const response = await instance.get(url)
  return response.data.data
}

const getSemesterEnrollments = async studentnumber => {
  const url = `${process.env.OODI_ADDR}/students/${studentnumber}/semesterenrollments`
  const response = await instance.get(url)
  return response.data.data
}


const getCourseRealisationTypes = async () => {
  const url = `${process.env.OODI_ADDR}/codes/courseunitrealisations/types`
  const response = await instance.get(url)
  return response.data.data
}

const getLearningOpportunity = async (id) => {
  const url = `${process.env.OODI_ADDR}/learningopportunities/${id}`
  const response = await instance.get(url)
  return response.data.data
}
const courseUnitRealisations = async () => {
  const url = `${process.env.OODI_ADDR}/courseunitrealisations/changes/ids/0000-12-24`
  const response = await instance.get(url)
  return response.data.data
}

const getCourseUnitRealisation = async id => {
  const url = `${process.env.OODI_ADDR}/courseunitrealisations/${id}`
  const response = await instance.get(url)
  return response.data.data
}
module.exports = {
  getStudyRights,
  getStudent,
  getTeacher,
  getStudyAttainments,
  getCourseTypeCodes,
  getLearningOpportunity,
  getStudyattainmentStatusCodes,
  getSemesters,
  getSemesterEnrollments,
  getCourseRealisationTypes,
  courseUnitRealisations,
  getCourseUnitRealisation
}