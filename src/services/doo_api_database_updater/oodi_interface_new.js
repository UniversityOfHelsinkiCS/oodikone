require('dotenv').config()
const axios = require('axios')
const { OODI_ADDR } = require('../../conf-backend')
const https = require('https')

const base_url = OODI_ADDR

const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})

if ( process.env.NODE_ENV !== 'test' ) {

  axios.defaults.auth = {
    username: 'tktl',
    password: process.env.OODI_PW
  }

  axios.defaults.params = {
    token: process.env.TOKEN
  }
}

const attemptGetFor = async (url, attempts=5) => {
  let attempt = 0
  let response = 0
  while (attempt <= attempts) {
    attempt += 1
    try {
      response = await instance.get(url)
      return response
    } catch (error) {
      if (attempt === attempts) {
        throw error
      }
    }
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

module.exports = {
  getStudentStudyRights,
  getStudent,
  getFaculties,
  getStudyAttainments,
  getTeacherInfo
}