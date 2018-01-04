require('dotenv').config()
const axios = require('axios')
const data_mapper = require('./oodi_data_mapper')
const base_url = process.env.OODI_ADDR

axios.defaults.auth = {
  username: 'tktl',
  password: process.env.OODI_PW
} 

const getStudent = (studentNumber) => {
  return axios.get(base_url + '/students/' + studentNumber)
    .then(response => {
      console.log('Data for student: ' + studentNumber)
      return data_mapper.getStudentFromData(response.data)
    })
    .catch(error => {
      console.log('error getStudent' + studentNumber + '\n' + error)
    })
}

const getStudentStudyRights = (studentNumber) => {
  return axios.get(base_url + '/students/' + studentNumber + '/studyrights')
    .then(async response => {
      const studyRightIds = data_mapper.getStudyRightIdStrings(response.data)
      let studyRights = []
      console.log(studyRightIds)
      await Promise.all(studyRightIds.map(async id => {
        try {
          let right = await getStudyRight(id)
          if (right) {
            right['student'] = studentNumber
            studyRights.push(right)
            console.log(right.studyRightId)
          }
        } catch (e) {
          console.log(e)
          throw e
        }
      }))
      return studyRights
    })
    .catch(error => {
      console.log('error getStudentStudyRights\n' + error)
    })
}

const getStudyRight = (studyRightId) => {
  return axios.get(base_url + '/studyrights/' + studyRightId)
    .then(response => {
      return data_mapper.getStudyRightFromData(response.data)
    })
    .catch(error => {
      console.log('error getStudyRights\n' + error)
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

module.exports = {
  getStudentStudyRights, getStudent, getStudyRight, getOrganisation,
  getStudentCourseCredits, getStudentNumbers, getTeacherDetails,
} 