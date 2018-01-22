const { CourseInstance, Course } = require('../../models')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const OrganisationService = require('../organisations')
const { getDate, getTeachersAndRolesFromData } = require('./oodi_data_mapper')
const CourseService = require('../courses')
const TeacherService = require('../teachers')
const CreditService = require('../credits')
const Oi = require('./oodi_interface')
const { log, logError } = require('./logger')


let minStudentNumber = 1441096
let maxStudentNumber = 1500000
console.log('Running updater on ' + minStudentNumber + '-' + maxStudentNumber)

const updateStudentInformation = async studentNumber => {
  try {
    let student = await loadAndUpdateStudent(studentNumber)
    if (student === null) {
      return
    }
    await Promise.all([updateStudentStudyRights(student), updateStudentCredits(student)])
    return
  } catch (e) {
    logError('Student: ' + studentNumber + ' UpdateStudenInformation failed.')
    logError(e)
  }
}

const updateStudentStudyRights = async student => {
  try {
    let [oodiStudentStudyRights, studentStudyRights] =
      await Promise.all([Oi.getStudentStudyRights(student.studentnumber),
        StudyrightService.byStudent(student.studentnumber)])
    studentStudyRights = studentStudyRights.map(studyright => studyright.dataValues)
    if (studentStudyRights && oodiStudentStudyRights.length === studentStudyRights.length) {
      return
    }
    const studentStudyRightIds = studentStudyRights.map(sr => sr.studyrightid)
    await Promise.all(oodiStudentStudyRights.map(async studyRight => {
      if (!studentStudyRightIds.includes(studyRight.studyRightId)) {
        let organisation = await OrganisationService.byCode(studyRight.organisation)
        if (organisation === null) {
          organisation = await Oi.getOrganisation(studyRight.organisation)
          try {
            await OrganisationService.createOrganisation(organisation)
            log('Organisation ' + organisation.code + ' ' +
              organisation.name + ' created')
          } catch (e) {
            logError('Saving organisation to database failed, line: ' + e.lineNumber + ', errormessage:')
            logError(e)
            return
          }
        }
        studyRight.organisation = organisation.code
        studyRight.student = student.studentnumber
        try {
          await StudyrightService.createStudyright(studyRight)
          log('Student ' + student.studentnumber + ': new studyright created: '
            + studyRight.highLevelName)
        } catch (e) {
          logError('Saving studyright to database failed, line: ' + e.lineNumber + ', errormessage:')
          logError(e)
        }
      }
    }))
  } catch (e) {
    logError('Updating studyrights failed')
    logError(e)
  }
}

const updateStudentCredits = async student => {
  try {
    const [studentCourseCredits, studentOldCredits] =
      await Promise.all([Oi.getStudentCourseCredits(student.studentnumber), student.getCredits()])

    if (!studentCourseCredits || studentOldCredits.length === studentCourseCredits.length) {
      return
    }
    log('Student: ' + student.studentnumber + ' updating credits')
    log('Student: ' + student.studentnumber + ' old course count: ' + studentOldCredits.length + ' new course count: ' + studentCourseCredits.length)

    for (let i = 0; i < studentCourseCredits.length; i++) {
      let oodiCredit = studentCourseCredits[i]
      // check for each credit whether oodikone db already has it
      const hasCredit = await studentAlreadyHasCredit(student, oodiCredit)
      if (!hasCredit) {
        let oodiCreditCourseCode = oodiCredit.courseInstance.course.courseCode
        let oodiCourseName = oodiCredit.courseInstance.course.courseName
        let oodiDate = getDate(oodiCredit.courseInstance.date)
        let [instance, course] =
          await Promise.all([CourseService.courseInstanceByCodeAndDate(oodiCreditCourseCode, oodiDate),
            Course.findById(oodiCreditCourseCode)])
        // if the course doesn't exist and the instance doesn't exist, handle those.
        if (course === null) {
          try {
            course = await CourseService.createCourse(oodiCreditCourseCode, oodiCourseName)
            log('Created new course ' + course.code + ', ' + course.name)
          } catch (e) {
            logError('Error creating new course: ' + course.code + '. Error message:')
            logError(e)
            return
          }
        }

        if (instance === null) {
          // create a course instance
          try {
            instance = await CourseService.createCourseInstance(oodiDate, course)
            log('Created new instance ' + instance.id + ' of course ' + course.code)
          } catch (e) {
            logError('Error creating new course instance: ' + course.code + '. Error message:')
            logError(e)
            return
          }
          // get all teachers for course instance
          const teacherDetails = await Oi.getTeacherDetails(oodiCreditCourseCode, oodiCredit.courseInstance.date)
          const teachers = getTeachersAndRolesFromData(teacherDetails.data)
          for (let i = 0; i < teachers.length; i++) {
            let t = teachers[i]
            // check if teacher exists in database and if not, create
            let teacher = await TeacherService.findOrCreateTeacher(t.code, t.name)
            // make CourseTeachers from teachers
            let courseTeacher = await TeacherService.createCourseTeacher(t.role, teacher, instance)
            // set teacher as CourseTeacher for the CourseInstance
            instance = await instance.addCourseteacher(courseTeacher)
            log('Added ' + t.name + ' as teacher for course ' + course.code + ' instance ' + instance.id)
          }
        }
        // create a new credit
        try {
          await CreditService.createCredit(oodiCredit, student.studentnumber, instance.id)
          log('Student: ' + student.studentnumber + ' new credit for course ' + course.code + ' instance ' + instance.id + ' created')
        } catch (e) {
          logError('ERROR: Student: ' + student.studentnumber + ' updateStudentCredits failed. ')
          logError(e)
        }

      }
    }
  } catch (e) {
    logError('ERROR: Student: ' + student.studentnumber + ' could not create credit for course ')
    logError(e)
  }
}

const studentAlreadyHasCredit = async (student, oodiCredit) => {
  try {
    // get the course code of the credit from Oodi
    let creditCode = oodiCredit.courseInstance.course.courseCode
    let creditDate = getDate(oodiCredit.courseInstance.date)
    const credits = await student.getCredits()

    await Promise.all(credits.map(async studentCredit => {
      let instance = await CourseInstance.findById(studentCredit.courseinstance_id)
      // get the course code from credit in oodikone db
      let instanceCode = instance.course_code
      let instanceDate = instance.coursedate
      // compare codes and grades
      if (creditCode === instanceCode && creditDate === instanceDate) {
        // if the oodi grade is better, update it
        if (parseInt(oodiCredit.grade) && parseInt(oodiCredit.grade) > studentCredit.grade) {
          try {
            await CreditService.updateCreditGrade(studentCredit, oodiCredit.grade)
            log('Student: ' + student.studentnumber + ' course instance with code ' + instanceCode + ' credit grade updated: ' + studentCredit.grade + ' => ' + oodiCredit.grade)
          } catch (e) {
            logError('Student: ' + student.studentnumber + ' course instance with code ' + instanceCode + ' credit grade update ' + studentCredit.grade + ' => ' + oodiCredit.grade + ' FAILED')
            logError(e)
          }
        }
        return true
      }
    }))
    return false
  } catch (e) {
    logError('Student: ' + student.studentnumber + ' alreadyHasCredit check FAILED')
    logError(e)
  }
}

const loadAndUpdateStudent = async studentNumber => {
  try {
    let [student, studentFromOodi] =
      await Promise.all([StudentService.byId(studentNumber), Oi.getStudent(studentNumber)])
    if (studentFromOodi == null) {
      return null
    }
    if (student == null) {
      try {
        student = await StudentService.createStudent(studentFromOodi)
        log('Student ' + studentNumber + ' created to database')
        return student
      } catch (e) {
        logError('Student ' + studentNumber + ': creation failed, error message:')
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
    1441096
    if(i%50000 === 0) log('Running: 0' + i + getStudentNumberChecksum(String(i)))
    let studentNumber = '0' + i + getStudentNumberChecksum(String(i))
    await updateStudentInformation(studentNumber)
  }
  process.exit(0)
}
run()