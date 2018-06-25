require('dotenv').config()
const axios = require('axios')
const data_mapper = require('./oodi_data_mapper')
const { OODI_ADDR } = require('../../conf-backend')
const https = require('https')
const logger = require('../../util/logger')

const base_url = OODI_ADDR

const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})

axios.defaults.auth = {
  username: 'tktl',
  password: process.env.OODI_PW
} 

axios.defaults.params = {
  token: process.env.TOKEN
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
      logger.error(`##################%€€€€€€€€€€€€€€€€%%%%%%%%%%%%%%%%% GET ${url} failed: ${error.message})`)
      if (attempt === attempts) {
        throw error
      }
    }
  }
}

const requestStudent = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/info`
  const response = await attemptGetFor(url)
  return response
  //const data = response.data.data
  //return data && data_mapper.getStudentFromData(data)
}

const getStudent = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/info`
  const response = await attemptGetFor(url)
  const data = response.data.data
  return data && data_mapper.getStudentFromData(data)
}

const getStudentStudyRights = async studentNumber => {
  const url = `${base_url}/students/${studentNumber}/studyrights`
  const response = await attemptGetFor(url)
  return response.data.data.map(data => data_mapper.getStudyRightFromData(data, studentNumber))
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
  return data_mapper.getTeacherFromData(response.data.data)
}

module.exports = {
  getStudentStudyRights,
  getStudent,
  getFaculties,
  getStudyAttainments,
  getTeacherInfo,
  requestStudent
}