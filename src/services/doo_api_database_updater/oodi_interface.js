require('dotenv').config()
const axios = require('axios')
const data_mapper = require('./oodi_data_mapper')
const base_url = process.env.OODI_ADDR
const https = require('https')

const instance = axios.create({
  httpsAgent: new https.Agent({  
    rejectUnauthorized: false
  })
})

axios.defaults.auth = {
  username: 'tktl',
  password: process.env.OODI_PW
} 

const addTokenToUrl = (url) => {
  return `${url}?token=${process.env.TOKEN}`
}

const getStudent = async studentNumber => {
  const url = addTokenToUrl(`${base_url}/students/${studentNumber}/info`)
  const response = await instance.get(url)
  return data_mapper.getStudentFromData(response.data)
}

const getStudentStudyRights = async studentNumber => {
  const url = addTokenToUrl(`${base_url}/students/${studentNumber}/studyrights`)
  const response = await instance.get(url)
  return response.data.data.map(data => data_mapper.getStudyRightFromData(data, studentNumber))
}

const getFaculties = async () => {
  const url = addTokenToUrl(`${base_url}/codes/faculties`)
  const response = await instance.get(url)
  return response.data.data
}

const getStudyAttainments = async studentNumber => {
  const url = addTokenToUrl(`${base_url}/students/${studentNumber}/studyattainments`)
  const response = await instance.get(url)
  return response.data.data
}

const getTeacherInfo = async id => {
  const url = addTokenToUrl(`${base_url}/teachers/${id}/info`)
  const response = await instance.get(url)
  return data_mapper.getTeacherFromData(response.data.data)
}

module.exports = {
  getStudentStudyRights,
  getStudent,
  getFaculties,
  getStudyAttainments,
  getTeacherInfo
}