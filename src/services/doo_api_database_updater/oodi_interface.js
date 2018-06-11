require('dotenv').config()
const axios = require('axios')
const data_mapper = require('./oodi_data_mapper')
const base_url = process.env.OODI_ADDR
const https = require('https')
const logger = require('../../util/logger')

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

const httpsAgent = new https.Agent({  
  rejectUnauthorized: false
})

const getStudent = (studentNumber) => {
  const url = addTokenToUrl(`${base_url}/students/${studentNumber}/info`)
  return axios.get(url, { httpsAgent })
    .then(response => {
      return data_mapper.getStudentFromData(response.data)
    })
    .catch(error => {
      return null
    })
}

const getStudentStudyRights = (studentNumber) => {
  const url = addTokenToUrl(`${base_url}/students/${studentNumber}/studyrights`)
  return axios.get(url, { httpsAgent })
    .then( response => {
      return response.data.data
    })
    .catch(error => {
      console.log('error getStudentStudyRights\n' + error)
    })
}

const getOrganisation = (organisationId) => {
  return axios.get(base_url + '/organisations/' + organisationId + '?language_code=en')
    .then(response => {
      return data_mapper.getOrganisationFromData(response.data)
    })
    .catch(error => {
      console.log('error getOrganization\n' + error)
    })
}

const getTeacherDetails = (courseCode, date) => {
  return axios.get(base_url + '/courses/' + courseCode + '/' + date + '/teacherdetails')
    .then(response => {
      return response.data
    })
    .catch(error => {
      console.log('error getTeacherDetails\n' + error)
    })
}

// TODO function not in use?xw
const getStudentNumbers = () => {
  return axios.get(base_url + '/programs/students/since/01.01.1965')
    .then(response => {
      return data_mapper.getStudentNumbersFromProgramData(response.data)
    })
    .catch(error => {
      console.log('error with getStudentNumbers\n' + error)
    })
}


const getStudentCourseCredits = (studentNumber) => {
  return axios.get(base_url + '/credits/' + studentNumber)
    .then(response => {
      return data_mapper.getCourseCreditsFromData(response.data)
    })
    .catch(error => {
      console.log('error with getStudentCourseCredits\n' + error)
    })
}

const getFaculties = () => {
  const url = addTokenToUrl(`${base_url}/codes/faculties`)
  return axios.get(url, { httpsAgent })
    .then(response => {
      return response.data.data
    })
    .catch(error => {
      logger.error(`Error getting organization codes: ${error.message}`)
    })
}

const getStudyAttainments = (studentNumber) => {
  const url = addTokenToUrl(`${base_url}/students/${studentNumber}/studyattainments`)
  return axios.get(url, { httpsAgent })
    .then(response => {
      return response.data.data
    }).catch(error => {
      logger.error(`Error getting study attainments for student ${studentNumber}: ${error.message}`)
    })
}

module.exports = {
  getStudentStudyRights,
  getStudent,
  getOrganisation,
  getStudentCourseCredits,
  getStudentNumbers,
  getTeacherDetails,
  getFaculties,
  getStudyAttainments
}