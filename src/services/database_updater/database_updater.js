const Sequelize = require('sequelize')
const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../models')
const StudentService = require('../services/students')
const Op = Sequelize.Op
const Oi = require('./oodi_interface')

let daa = Oi.getStudent('014424850')
let daa2 = Oi.getStudentStudyRights('014424850')
let daa3 = Oi.getStudyRight('102357732')

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

function updateStudentStudyRights(student) {
  let studentStudyRights = Oi.getStudentStudyRights(student)
  if (student.studyrights.length === studentStudyRights.length) {
    console.log('Student: ' + student.studentnumber + 'No need to update study rights')
    return
  }
  console.log('Student: ' + student.studentnumber + ' updating study rights')

  studentStudyRights.forEach(studyRight => {
    if (!student.studyrights.includes(studyRight)) {
      // Organization model does not exist
      let organization = Organization.findByCode(studyRight.organization_code)
      if (organization === null) {
        organization = Oi.getOrganisation(studyRight.organization_code)
        // save the organization
      }
    }
  })
  /*
  for (StudyRight studyRight : studentStudyRightsFromOodi) {
    if (student.getStudyRights().contains(studyRight)) {
        continue;
    }

    Organization organization = organizationRepository.findByCode(studyRight.getOrganization().getCode());
    if (organization == null) {
        organization = oi.getOrganization(studyRight.getOrganization().getCode());
        organization = organizationRepository.saveAndFlush(organization);
    }
    studyRight.setOrganization(organization);

    studyRight.setStudent(student);
    studyRight = studyRightRepository.saveAndFlush(studyRight);
    student.getStudyRights().add(studyRight);
}

}

function updateStudentCredits() {
*/
}

function studentAlreadyHasCredit(student, credit) {
  student.getCredits.forEach(studentCredit => {
    // do below credit methods exist?
    if (credit.getGrade() === studentCredit.getGrade() && 
        credit.hasSameCourseInstance(studentCredit.getCourseInstance())) {
      return true
    }
  })
  return false
}

function loadAndUpdateStudent(studentNumber) {
  let student = StudentService.bySearchTerm(studentNumber)
  if (student === null) {
    try {
      student = Oi.getStudent(studentNumber)
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
    studentFromOodi = Oi.getStudent(studentNumber)
  }
  catch(e) {
    console.log('couldn\'t fetch student ' + studentNumber + '\'s information.')
    console.log(e)
    return null
  }
  // does the getDateOfLastCredit method exist?
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