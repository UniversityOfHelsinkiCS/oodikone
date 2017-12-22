//const Sequelize = require('sequelize')
//const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../models')
//const { formatStudent } = require('../services/students')
//const Op = Sequelize.Op
const {getStudent, getStudentStudyRights} = require('./oodi_interface')

let daa = getStudent('014424850')
let daa2 = getStudentStudyRights('014424850')

let minStudentNumber = 1000000
let maxStudentNumber = 1500000

// add possibility to update specific students ?
console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

for (let i = minStudentNumber; i < maxStudentNumber; i++) {
  let studentNumber = '0' + i + getStudentNumberChecksum(i.toString)
  console.log('Updating student ' + studentNumber)

  updateStudentInformation(studentNumber)
}

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