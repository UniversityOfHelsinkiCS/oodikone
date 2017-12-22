const axios = require('axios')
require('dotenv').config()

axios.defaults.auth = {
  username: 'tktl',
  password: process.env.OODI_PW
}



const base_url = process.env.OODI_ADDR

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

// String getTeacherDetails(String courseCode, String date)

// String queryUrl(String url)

// List < String > getStudentNumbers()

// Student getStudent(String studentNumber)

// returns a list og studyright ids
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
// 
// Organization getOrganization(String organizationId)
// 
// List < Credit > getStudentCourseCredits(Student student)
// 
// StudyRight getStudyRight(String studyRightId)
// 
// List < String > getStudyRightIdStrings(String data)

module.exports = {
  getStudentStudyRights, getStudent
}