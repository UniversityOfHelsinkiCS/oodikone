require('dotenv').config()
const axios = require('axios')
const { OODI_ADDR } = require('../../conf-backend')
const https = require('https')
const fs = require('fs')
const base_url = OODI_ADDR

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

const getUrl = process.env.NODE_ENV === 'anon' ? async (url) => JSON.parse(await fs.readFileSync(url)) : instance.get

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

module.exports = {
  getStudentStudyRights,
  getStudent,
  getFaculties,
  getStudyAttainments,
  getTeacherInfo,
  getCourseTypeCodes,
  getLearningOpportunity,
  getStudyattainmentStatusCodes
}