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
const { log, logError } = require('./logger')


let minStudentNumber = 1400000
let maxStudentNumber = 1500000
console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

const updateStudentInformation = async studentNumber => {
  if (studentNumber == '014424850') return
  let student = await loadAndUpdateStudent(studentNumber)
  if (student === null) {
    return
  }
  updateStudentStudyRights(student)
  await updateStudentCredits(student)
  return
}

const updateStudentStudyRights = async student => {
  try {
    const oodiStudentStudyRights = await Oi.getStudentStudyRights(student.studentnumber)
    const studentStudyRights = await StudyrightService.byStudent(student.studentnumber).map(studyright => studyright.dataValues)
    if (oodiStudentStudyRights.length === studentStudyRights.length) {
      return
    }
    const studentStudyRightIds = studentStudyRights.map(sr => sr.studyrightid)

    oodiStudentStudyRights.forEach(async studyRight => {
      if (!studentStudyRightIds.includes(studyRight.studyRightId)) {
        let organisation = await OrganisationService.byCode(studyRight.organisation)
        if (organisation === null) {
          organisation = await Oi.getOrganisation(studyRight.organisation_code)
          try {
            OrganisationService.createOrganisation(organisation)
            log('Organisation ' + organisation.code + ' ' +
              organisation.name + ' created')
          } catch (e) {
            logError('Saving organisation to database failed, line: ' + e.lineNumber + ', errormessage:')
            logError(e)
          }
        }
        studyRight.organisation = organisation.code
        studyRight.student = student.studentnumber
        try {
          StudyrightService.createStudyright(studyRight)
          log('Student ' + student.studentnumber + ': new studyright created: '
            + studyRight.highLevelName)
        } catch (e) {
          logError('Saving studyright to database failed, line: ' + e.lineNumber + ', errormessage:')
          logError(e)
        }
      }
    })
  } catch (e) {
    logError('Updating studyrights failed')
    logError(e)
  }
}

const updateStudentCredits = async student => {
  // get credits from Oodi
  let studentCourseCredits = await Oi.getStudentCourseCredits(student.studentnumber)

  let studentOldCredits = await student.getCredits()

  if (studentOldCredits.length === studentCourseCredits.length) {
    // log('Student: ' + student.studentnumber + ' no need to update credits')
    return
  }
  log('Student: ' + student.studentnumber + ' updating credits')
  for (let i = 0; i < studentCourseCredits.length; i++) {
    let oodiCredit = studentCourseCredits[i]
    // check for each credit whether oodikone db already has it
    const hasCredit = await studentAlreadyHasCredit(student, oodiCredit)
    if (!hasCredit) {
      let oodiCreditCourseCode = oodiCredit.courseInstance.course.courseCode
      let oodiCourseName = oodiCredit.courseInstance.course.courseName
      let oodiDate = getDate(oodiCredit.courseInstance.date)
      let instance = await CourseService.courseInstanceByCodeAndDate(oodiCreditCourseCode, oodiDate)
      let course = await Course.findById(oodiCreditCourseCode)
      // if the course doesn't exist and the instance doesn't exist, handle those.
      if (course === null) {
        course = await CourseService.createCourse(oodiCreditCourseCode, oodiCourseName)
      }

      if (instance === null) {
        // save CourseInstance 
        try {
          instance = await CourseService.createCourseInstance(oodiDate, course)
          log('Created new instance of course ' + course.name)
        } catch (e) {
          logError('Error creating new course instance: ' + course.name + '. Error message:')
          logError(e)
          return
        }
        // get all teachers for course instance
        const teacherDetails = await Oi.getTeacherDetails(oodiCreditCourseCode, oodiCredit.courseInstance.date)
        const teachers = getTeachersAndRolesFromData(teacherDetails.data)
        for (let i = 1; i < teachers.length; i++) {
          let t = teachers[i]
          // check if teacher exists in database and if not, create
          let teacher = await TeacherService.findOrCreateTeacher(t.code, t.name)
          // make CourseTeachers from teachers
          let courseTeacher = await TeacherService.createCourseTeacher(t.role, teacher, instance)
          // set teacher as CourseTeacher for the CourseInstance
          instance = await instance.addCourseteacher(courseTeacher)
          log('Added ' + t.name + ' as teacher for course ' + course.name)
        }
        // await instance.save()

      }
      // create a new credit
      try {
        const newCredit = await CreditService.createCredit(oodiCredit, student.studentnumber, instance.id)
        log('Student: ' + student.studentnumber + ' new credit for course ' + course.code + ' created')
      } catch (e) {
        logError('ERROR: Student: ' + student.studentnumber + ' could not create credit for course ' + course.code)
        logError(e)
      }

    }
  }
  //await student.save()
}

const studentAlreadyHasCredit = async (student, oodiCredit) => {
  // get the course code of the credit from Oodi
  let creditCode = oodiCredit.courseInstance.course.courseCode
  const credits = await student.getCredits()
  credits.forEach(async studentCredit => {
    let instance = await CourseInstance.findById(studentCredit.courseinstance_id)
    // get the course code from credit in oodikone db
    let instanceCode = instance.course_code
    // compare codes and grades
    if (creditCode === instanceCode) {
      // if the oodi grade is better, update it
      if (oodiCredit.grade > studentCredit.grade) {
        try {
          await CreditService.updateCreditGrade(studentCredit, oodiCredit.grade)
          log('Student: ' + student.studentnumber + ' credit grade updated')
        } catch (e) {
          logError('Student ' + student.studentnumber + ' credit grade update failed')
          logError(e)
        }
      }
      return true
    }
  })
  return false
}

const loadAndUpdateStudent = async studentNumber => {
  try {
    let student = await StudentService.byId(studentNumber)

    let studentFromOodi = await Oi.getStudent(studentNumber)
    if (studentFromOodi == null) {
      return null
    }
    if (student == null) {
      try {
        StudentService.createStudent(student)
        log('Student ' + studentNumber + ' created to database')
        return student
      } catch (e) {
        logError('Student ' + studentNumber + ': creation failed, line: ' + e.lineNumber + ', error message:')
        logError(e)
        return null
      }
    }
    let oodiLastCreditDate
    if (studentFromOodi[21] != null) {
      oodiLastCreditDate = getDate(studentFromOodi[21], 'DD.MM.YYYY')
    }
    if (oodiLastCreditDate == null ||
      oodiLastCreditDate === getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD')) {
      return student
    }

    try {
      await StudentService.updateStudent(studentFromOodi)
      log('Student ' + studentNumber + ': details updated')
    } catch (e) {
      logError('Student ' + studentNumber + ': update failed, line: ' + e.lineNumber + ', error message:')
      logError(e)
    }
    return student
  } catch (e) {
    logError('Student: ' + studentNumber + ' loadAndUpdate failed, line: ' + e.lineNumber + ', error message:')
    logError(e)
  }
}


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