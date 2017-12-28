const Sequelize = require('sequelize')
const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../models')
const StudentService = require('../services/students')
const Op = Sequelize.Op
const {getStudent, getStudentStudyRights, getStudyRight} = require('./oodi_interface')

let daa = getStudent('014424850')
let daa2 = getStudentStudyRights('014424850')
let daa3 = getStudyRight('102357732')

// let minStudentNumber = 1000000
// let maxStudentNumber = 1500000

// add possibility to update specific students ?
// console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

// for (let i = minStudentNumber; i < maxStudentNumber; i++) {
//   let studentNumber = '0' + i + getStudentNumberChecksum(i.toString)
//   console.log('Updating student ' + studentNumber)

//   updateStudentInformation(studentNumber)
// }

/**
 * Calculate checksum of student number.
 *
 * @param studentNumber Student number without the checksum (last digit).
 * @return Checksum digit.
 
function getStudentNumberChecksum(studentNumber) {
  let checksumNumbers = [7, 3, 1]
  let checksum = 0

  for (let i = 0; i < studentNumber.length; i++) {
    // go from end to start
    let currentNumber = studentNumber.charAt(studentNumber.length - (i + 1))
    checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
  }

  return (10 - (checksum % 10)) % 10
}
*/

function updateStudentInformation(studentNumber) {
  let student = loadAndUpdateStudent(studentNumber)
  if (student === null) {
    return
  }
  updateStudentStudyRights(student)
  updateStudentCredits(student)
}

function updateStudentStudyRights() {

}

function updateStudentCredits() {

}

function studentAlreadyHasCredit() {

}

function loadAndUpdateStudent(studentNumber) {
  let student = StudentService.bySearchTerm(studentNumber)
  if (student === null) {
    try {
      student = getStudent(studentNumber)
    }
    catch(e) {
      console.log('couldn\'t fetch student ' + studentNumber + '\'s information.')
      console.log(e)
      return null
    }
    // save student here
    return student
  }

  console.log('Student ' + studentNumber + ' found in database')
  let studentFromOodi
  try {
    studentFromOodi = getStudent(studentNumber)
  }
  catch(e) {
    console.log('couldn\'t fetch student ' + studentNumber + '\'s information.')
    console.log(e)
    return null
  }
  if (studentFromOodi.getDateOfLastCredit() === null ||
      studentFromOodi.getDateOfLastCredit() === student.getDateOfLastCredit()) {
    console.log('No need to update student ' + studentNumber + ' information.')
    return student
  }

  // info has changed, let's change details
  student.updateDetailsFrom(studentFromOodi)
  // save student here
  console.log('Student ' + studentNumber + ' details updated')
  return student
}