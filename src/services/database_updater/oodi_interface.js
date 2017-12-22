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
      console.log('asd')
    })

}

function getStudentStudyRights(studentNumber) {
  axios.get(base_url + '/students/' + studentNumber + '/studyrights')
    .then(response => {

      console.log(response)
      return response
    })
    .catch(error => {
      console.log('error')
    })

}

function getStudyRight(studyRightId) {
  axios.get(base_url + '/studyrights/' + studyRightId)
    .then(response => {
      console.log(response)
      return response
    })
    .catch(error => {
      console.log('error')
    })
}

// String getTeacherDetails(String courseCode, String date)

// String queryUrl(String url)

// List < String > getStudentNumbers()

// Student getStudent(String studentNumber)

// returns a list og studyright ids

// 
// Organization getOrganization(String organizationId)
// 
// List < Credit > getStudentCourseCredits(Student student)
// 

// 
// List < String > getStudyRightIdStrings(String data)

module.exports = {
  getStudentStudyRights, getStudent, getStudyRight
}