const axios = require('axios')
require('dotenv').config()
const base_url = process.env.OODI_ADDR

axios.defaults.auth = {
  username: 'tktl',
  password: process.env.OODI_PW
}

function getStudent(studentNumber) {
  axios.get(base_url + '/students/' + studentNumber)
    .then(response => {

      console.log('Data for student: ' + studentNumber + '\n' + response)
      return response
    })
    .catch(error => {
      console.log('error getStudent')
    })

}

function getStudentStudyRights(studentNumber) {
  axios.get(base_url + '/students/' + studentNumber + '/studyrights')
    .then(response => {

      console.log(response.data)
      return response
    })
    .catch(error => {
      console.log('error getStudentStudyRights')
    })

}

function getStudyRight(studyRightId) {
  axios.get(base_url + '/studyrights/' + studyRightId)
    .then(response => {
      console.log(response.data)
      return response
    })
    .catch(error => {
      console.log('error getStudyRights')
    })
}

function getOrganization(organizationId) {
  axios.get(base_url + '/organizations/' + organizationId + '?language_code=en')
    .then(response => {
      console.log(response.data)
      return response
    })
    .catch(error => {
      console.log('error getOrganization')
    })
}



function getTeacherDetails(courseCode, date) {
  axios.get(base_url + '/courses/' + courseCode + '/' + date + '/teacherdetails')
    .then(response => {
      console.log(response.data)
      return response
    })
    .catch(error => {
      console.log('error getTeacherDetails')
    })
}

// String queryUrl(String url)

function getStudentNumbers() {
  axios.get(base_url + '/programs/students/since/01.01.1965')
    .then(response => {
      console.log(response.data)
      return response
    })
    .catch(error => {
      console.log('error with getStudentNumbers')
    })
}


function getStudentCourseCredits(studentNumber) {
  axios.get(base_url + '/credits/' + studentNumber)
    .then(response => {
      console.log(response.data)
      return response
    })
    .catch(error => {
      console.log('error with getStudentCourseCredits')
    })
}

// List < String > getStudyRightIdStrings(String data)

module.exports = {
  getStudentStudyRights, getStudent, getStudyRight, getOrganization, 
  getStudentCourseCredits, getStudentNumbers, getTeacherDetails,
}

