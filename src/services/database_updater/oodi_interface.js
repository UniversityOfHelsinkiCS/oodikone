const axios = require('axios')
require('dotenv').config()
const data_mapper = require('./oodi_data_mapper')
const base_url = process.env.OODI_ADDR

axios.defaults.auth = {
  username: 'tktl',
  password: process.env.OODI_PW
}

const getStudent = (studentNumber) => {
  axios.get(base_url + '/students/' + studentNumber)
    .then(response => {
      console.log('Data for student: ' + studentNumber)
      return data_mapper.getStudentFromData(response.data)
    })
    .catch(error => {
      console.log('error getStudent' + studentNumber + '\n' + error)
    })
}

const getStudentStudyRights = (studentNumber) => {
  axios.get(base_url + '/students/' + studentNumber + '/studyrights')
    .then(response => {
      const studyRightIds = data_mapper.getStudyRightIdStrings(response.data)
      let studyRights = []
      studyRightIds.forEach((studyRightId) => {
        let right = getStudyRight(studyRightId)
        if (!right) {
          return
        }
        right['student'] = studentNumber
        studyRights.push(right)
      })
      return studyRights
    })
    .catch(error => {
      console.log('error getStudentStudyRights\n' + error)
    })
}

const getStudyRight = (studyRightId) => {
  axios.get(base_url + '/studyrights/' + studyRightId)
    .then(response => {
      return data_mapper.getStudyRightFromData(response.data)
    })
    .catch(error => {
      console.log('error getStudyRights\n' + error)
    })
}

const getOrganisation = (organisationId) => {
  axios.get(base_url + '/organisations/' + organisationId + '?language_code=en')
    .then(response => {
      return data_mapper.getOrganisationFromData(response.data)
    })
    .catch(error => {
      console.log('error getOrganization\n' + error)
    })
}

const getTeacherDetails = (courseCode, date) => {
  axios.get(base_url + '/courses/' + courseCode + '/' + date + '/teacherdetails')
    .then(response => {
      return response.data
    })
    .catch(error => {
      console.log('error getTeacherDetails\n' + error )
    })
}

const getStudentNumbers = () => {
  axios.get(base_url + '/programs/students/since/01.01.1965')
    .then(response => {
      return data_mapper.getStudentNumbersFromProgramData(response.data)
    })
    .catch(error => {
      console.log('error with getStudentNumbers\n' + error)
    })
}


const getStudentCourseCredits = (studentNumber) => {
  axios.get(base_url + '/credits/' + studentNumber)
    .then(response => {
      return data_mapper.getCourseCreditsFromData(response.data)
    })
    .catch(error => {
      console.log('error with getStudentCourseCredits\n' + error)
    })
}

module.exports = {
  getStudentStudyRights, getStudent, getStudyRight, getOrganisation,
  getStudentCourseCredits, getStudentNumbers, getTeacherDetails,
}