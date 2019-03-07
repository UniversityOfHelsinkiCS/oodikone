require('dotenv').config()
const axios = require('axios')
const { OODI_ADDR, KEY_PATH, CERT_PATH } = require('../../conf-backend')
const https = require('https')
const fs = require('fs')
const base_url = OODI_ADDR

const agent = KEY_PATH && CERT_PATH ? 
  new https.Agent({
    cert: fs.readFileSync(process.env.CERT_PATH, 'utf8'),
    key: fs.readFileSync(process.env.KEY_PATH, 'utf8'), 
  }) :
  new https.Agent({
    rejectUnauthorized: false
  })

const instance = axios.create({
  httpsAgent: agent
})

const getUrl = instance.get

const getOodiApi = async relative => {
  const route = base_url + relative
  const stuff = await getUrl(route)
  return stuff
}

const attemptGetFor = async (url, attempts = 5) => {
  let attempt = 0
  let response = 0
  while (attempt <= attempts) {
    attempt += 1
    try {
      response = await getUrl(url)
      return response
    } catch (error) {
      if (attempt === attempts) {
        throw error
      }
    }
  }
}

if (process.env.NODE_ENV === 'dev') {

  axios.defaults.auth = {
    username: 'tktl',
    password: process.env.OODI_PW
  }
  axios.defaults.params = {
    token: process.env.TOKEN
  }

}

const getStudent = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/info`
  const response = await attemptGetFor(url)
  const data = response.data.data
  return data
}

const getStudentStudyRights = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyrights`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getFaculties = async () => {
  const url = `${base_url}/codes/faculties`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getStudyAttainments = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyattainments`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getTeacherInfo = async id => {
  const url = `${base_url}/teachers/${id}/info`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getCourseTypeCodes = async () => {
  const url = `${base_url}/codes/learningopportunities/types`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getLearningOpportunity = async (id) => {
  const url = `${base_url}/learningopportunities/${id}`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getStudyattainmentStatusCodes = async () => {
  const url = `${base_url}/codes/studyattainments/statuses`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getCourseDisciplines = async () => {
  const url = `${base_url}/codes/learningopportunities/disciplines`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getSemesters = async () => {
  const url = `${base_url}/codes/semesters`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getSemesterEnrollments = async studentnumber => {
  const url = `${base_url}/students/${studentnumber}/semesterenrollments`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getCourseEnrollments = async studentnumber => {
  const url = `${base_url}/students/${studentnumber}/enrollments`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getCourseRealisationTypes = async () => {
  const url = `${base_url}/codes/courseunitrealisations/types`
  const response = await attemptGetFor(url)
  return response.data.data
}

const courseUnitRealisationsSince = async sinceDate => {
  const url = `${base_url}/courseunitrealisations/changes/ids/${sinceDate}`
  const response = await attemptGetFor(url)
  return response.data.data
}

const learningOpportunitiesSince = async (sinceDate='0000-01-01') => {
  const url = `${base_url}/learningopportunities/changes/ids/${sinceDate}`
  const response = await attemptGetFor(url)
  return response.data.data
}

const getCourseUnitRealisation = async id => {
  const url = `${base_url}/courseunitrealisations/${id}`
  const response = await attemptGetFor(url)
  return response.data.data
}

module.exports = {
  getStudentStudyRights,
  getStudent,
  getFaculties,
  getStudyAttainments,
  getTeacherInfo,
  getCourseTypeCodes,
  getLearningOpportunity,
  getStudyattainmentStatusCodes,
  getCourseDisciplines,
  getSemesters,
  getSemesterEnrollments,
  getCourseEnrollments,
  getCourseRealisationTypes,
  courseUnitRealisationsSince,
  getCourseUnitRealisation,
  learningOpportunitiesSince,
  getOodiApi
}