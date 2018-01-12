const Sequelize = require('sequelize')
const { Studyright, Student, Credit, CourseInstance, Course, CourseTeacher, TagStudent, sequelize } = require('../../models')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const OrganisationService = require('../organisations')
const { getDate, getTeachersAndRolesFromData } = require('./oodi_data_mapper')
const CourseService = require('../courses')
const TeacherService = require('../teachers')
const CreditService = require('../credits')
const Op = Sequelize.Op
const Oi = require('./oodi_interface')


let minStudentNumber = 1450000
let maxStudentNumber = 1500000
console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

const updateStudentInformation = async studentNumber => {
  if(studentNumber == '014424850') return
  let student = await loadAndUpdateStudent(studentNumber)
  if (student === null) {
    return
  }
  //updateStudentStudyRights(student)
  updateStudentCredits(student)
  return
}

const updateStudentStudyRights = async student => {
  const oodiStudentStudyRights = await Oi.getStudentStudyRights(student.studentnumber)
  const studentStudyRights = await StudyrightService.byStudent(student.studentnumber).map(studyright => studyright.dataValues)
  if (oodiStudentStudyRights.length === studentStudyRights.length) {
    return
  }
  //not the best solution so far 
  const studentStudyRightIds = studentStudyRights.map(sr => sr.studyrightid)

  oodiStudentStudyRights.forEach(async studyRight => {
    if (!studentStudyRightIds.includes(studyRight.studyRightId)) {
      let organisation = await OrganisationService.byCode(studyRight.organisation)
      if (organisation === null) {
        organisation = await Oi.getOrganisation(studyRight.organisation_code)
        OrganisationService.createOrganisation(organisation)
      }
      studyRight.organisation = organisation.code
      studyRight.student = student.studentnumber

      StudyrightService.createStudyright(studyRight)
      console.log('Student ' + student.studentnumber + ': new studyright added')
    }
  })
}

// NEED TO INCLUDE UPDATE EXISTING CREDIT
const updateStudentCredits = async student => {
  // get credits from Oodi
  let studentCourseCredits = await Oi.getStudentCourseCredits(student.studentnumber)

  await student.getCredits().then(studentOldCredits => {
    if (studentOldCredits.lenght === studentCourseCredits.length) {
      console.log('Student: ' + student.studentnumber + ' no need to update credits')
      return
    }
  })
  console.log('Student: ' + student.studentnumber + ' updating credits')
  studentCourseCredits.forEach(async credit => {
    // check for each credit whether oodikone db already has it
    if (!studentAlreadyHasCredit(student, credit)) {
      let oodiCreditCourseCode = credit.courseInstance.course.courseCode
      let oodiCourseName = credit.courseInstance.course.courseName
      let oodiDate = getDate(credit.courseInstance.date)
      let instance = await CourseService.courseInstanceByCodeAndDate(oodiCreditCourseCode, oodiDate)
      let course = await Course.findById(oodiCreditCourseCode)
      // if the course doesn't exist and the instance doesn't exist, handle those.
      if (course === null) {
        course = await CourseService.createCourse(oodiCreditCourseCode, oodiCourseName)
      }

      if (instance === null) {
        // save CourseInstance 
        instance = await CourseService.createCourseInstance(oodiDate, course)
        // get all teachers for course instance
        const teacherDetails = await Oi.getTeacherDetails(oodiCreditCourseCode, credit.courseInstance.date)
        const teachers = getTeachersAndRolesFromData(teacherDetails.data)
        teachers.forEach(async t => {
          // check if teacher exists in database and if not, create
          let teacher =  await TeacherService.findOrCreateTeacher(t.code, t.name)
          // make CourseTeachers from teachers
          let courseTeacher = await TeacherService.createCourseTeacher(t.role, teacher, instance)
          // set teacher as CourseTeacher for the CourseInstance
          instance = await instance.addCourseteacher(courseTeacher)
        })
        // await instance.save()
        
      }
      // create a new credit
      const newCredit = await CreditService.createCredit(credit, student.studentnumber, instance.id)
      console.log(newCredit)
    }
  })
  //await student.save()
}

const studentAlreadyHasCredit = (student, credit) => {
  // get the course code of the credit from Oodi
  let creditCode = credit.courseInstance.course.courseCode
  student.getCredits().then(credits => {
    credits.forEach(async studentCredit => {
      let instance = await CourseInstance.findById(studentCredit.courseinstance_id)
      // get the course code from credit in oodikone db
      let instanceCode = instance.course_code
      // compare codes and grades
      if (creditCode === instanceCode && credit.grade === studentCredit.grade) {
        return true
      }
    })
  })
  return false
}

const loadAndUpdateStudent = async studentNumber => {
  let student = await StudentService.byId(studentNumber)
  
  let studentFromOodi = await Oi.getStudent(studentNumber)
  if (studentFromOodi == null) {
    return null
  }
  if (student == null) {
    StudentService.createStudent(student)
    return student
  }
  let oodiLastCreditDate
  if (studentFromOodi[21] != null) {
    oodiLastCreditDate = getDate(studentFromOodi[21], 'DD.MM.YYYY')
  }
  if (oodiLastCreditDate == null ||
    oodiLastCreditDate === getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD')) {
    return student
  }

  await StudentService.updateStudent(studentFromOodi)

  console.log('Student: ' + studentNumber + ' details updated')
  return student
}
// updateStudentInformation('0142712')

// updateStudentInformation('014349281')


const getStudentNumberChecksum = studentNumber => {
  let checksumNumbers = [7, 3, 1]
  let checksum = 0

  for (let i = 0; i < studentNumber.length; i++) {
    // go from end t start
    let currentNumber = studentNumber[studentNumber.length - (i + 1)]
    checksum += currentNumber * (checksumNumbers[i % checksumNumbers.length])
  }

  return (10 - (checksum % 10)) % 10
}


const run = async () => {

  for (let i = minStudentNumber; i < maxStudentNumber; i++) {
    let studentNumber = '0' + i + getStudentNumberChecksum(String(i))

    await updateStudentInformation(studentNumber)
  }

} 

run()