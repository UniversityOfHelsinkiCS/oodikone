const { Course, StudentList } = require('../../models')
const StudentService = require('../students')
const StudyrightService = require('../studyrights')
const OrganisationService = require('../organisations')
const { getDate, getTeachersAndRolesFromData } = require('./oodi_data_mapper')
const CourseService = require('../courses')
const TeacherService = require('../teachers')
const CreditService = require('../credits')
const Oodi = require('./oodi_interface')
const { Credit } = require('../../models')
const util = require('./util')

const _ = require('lodash')

const logger = require('../../util/logger')

const updateStudentInformation = async studentNumber => {
  try {
    // palauta myös oodistudent
    const student = await loadAndUpdateStudent(studentNumber)

    if (student === null) {
      logger.error('Cant get student ' + studentNumber )
      return [0, 0, 0]
    }

    return await Promise.all([
      updateStudentStudyRights(student), 
      updateStudentCredits(student)
    ])
    
  } catch (e) {
    logger.error('Student: ' + studentNumber + ' UpdateStudenInformation failed.')
  }
}

const updateStudentStudyRights = async student => {
  try {
    let [ WebOodiStudentStudyRights, OodiKoneStudentStudyRights ] = await Promise.all([
      Oodi.getStudentStudyRights(student.studentnumber),
      StudyrightService.byStudent(student.studentnumber)
    ])

    OodiKoneStudentStudyRights = OodiKoneStudentStudyRights.map(studyright => studyright.dataValues)
    if (OodiKoneStudentStudyRights && WebOodiStudentStudyRights.length === OodiKoneStudentStudyRights.length) {
      return 0
    }

    const OodiKonestudentStudyRightIds = OodiKoneStudentStudyRights.map(sr => sr.studyrightid).sort()
    const WebOodiStudentStudyRightIds = WebOodiStudentStudyRights.map(sr => sr.studyRightId).sort()

    logger.verbose('studyright ids in database:' + OodiKonestudentStudyRightIds)
    logger.verbose('                in weboodi:' + WebOodiStudentStudyRightIds)

    // TODO refactor...
    await Promise.all(WebOodiStudentStudyRights.map(async studyRight => {
      if (OodiKonestudentStudyRightIds.includes(studyRight.studyRightId)) {
        console.log('included!')
      } else {
        logger.verbose('id not included: ' + studyRight.studyRightId)

        let organisation = await OrganisationService.byCode(studyRight.organisation)
        if (organisation === null) {
          organisation = await Oodi.getOrganisation(studyRight.organisation)
          try {
            await OrganisationService.createOrganisation(organisation)
            logger.verbose('Organisation ' + organisation.code + ' ' +
              organisation.name + ' created')
          } catch (e) {
            logger.error('Saving organisation to database failed, line: ' + e.lineNumber + ', errormessage:')
            return
          }
        }
        studyRight.organisation = organisation.code
        studyRight.student = student.studentnumber

        try {
          await StudyrightService.createStudyright(studyRight)
          logger.verbose('Student ' + student.studentnumber + ': new studyright created: '
            + studyRight.highLevelName)
        } catch (e) {
          logger.error('Saving studyright to database failed, line: ' + e.lineNumber + ', errormessage:')
        }
      }
    }))
  } catch (e) {
    logger.error('Updating studyrights failed')
  }

  return 1
}

const updateStudentCredits = async (student) => {

  let newCredits = 0  

  try {
    const studentCourseCreditsInOodi = await Oodi.getStudentCourseCredits(student.studentnumber)

    if (!studentCourseCreditsInOodi || student.credits.length === studentCourseCreditsInOodi.length) {
      return 0
    }

    logger.verbose('Updating credits of student: ' + student.studentnumber + ' old course count: ' + student.credits.length + ' new course count: ' + studentCourseCreditsInOodi.length)

    for (let i = 0; i < studentCourseCreditsInOodi.length; i++) {
      let oodiCredit = studentCourseCreditsInOodi[i]

      // check for each credit whether oodikone db already has it
      const hasCredit = await studentAlreadyHasCredit(student, oodiCredit)

      if (hasCredit) continue

      // does not have the credit
      let oodiCreditCourseCode = oodiCredit.courseInstance.course.courseCode
      let oodiCourseName = oodiCredit.courseInstance.course.courseName
      let oodiDate = getDate(oodiCredit.courseInstance.date)

      let [ instance, course ] = await Promise.all([
        CourseService.courseInstanceByCodeAndDate(oodiCreditCourseCode, oodiDate),
        Course.findById(oodiCreditCourseCode)
      ])

      if (course === null) {
        try {
          course = await CourseService.createCourse(oodiCreditCourseCode, oodiCourseName)
          logger.verbose('Created new course ' + course.code + ', ' + course.name)
        } catch (e) {
          logger.error('Error creating new course: ' + course.code + '. Error message:')
          return 
        }
      }

      if (instance === null) {
        try {
          instance = await CourseService.createCourseInstance(oodiDate, course)
          logger.verbose('Created new instance ' + instance.id + ' of course ' + course.code)
        } catch (e) {
          logger.error('Error creating new course instance: ' + course.code + '. Error message:')
          return
        }

        // get all teachers for course instance
        const teacherDetails = await Oodi.getTeacherDetails(oodiCreditCourseCode, oodiCredit.courseInstance.date)
        const teachers = getTeachersAndRolesFromData(teacherDetails.data)
        for (let i = 0; i < teachers.length; i++) {
          let t = teachers[i]
          let teacher = await TeacherService.findOrCreateTeacher(t.code, t.name)
          let courseTeacher = await TeacherService.createCourseTeacher(t.role, teacher, instance)
          instance = await instance.addCourseteacher(courseTeacher)
          logger.verbose('Added ' + t.name + ' as teacher for course ' + course.code + ' instance ' + instance.id)
        }
      }

      // create a new credit
      try {
        await CreditService.createCredit(oodiCredit, student.studentnumber, instance.id)
        newCredits += oodiCredit.credits
        logger.verbose('Student: ' + student.studentnumber + ' new credit for course ' + course.code + ' instance ' + instance.id + ' created')
      } catch (e) {
        logger.error('ERROR: Student: ' + student.studentnumber + ' updateStudentCredits failed. ')
      }

    }

    // this happens due to changes in oodi such as change 'perusopinnot paaine' to 'perusopinnot sivuaine'
    await removedNonexistentCreditsFromOodikone(student, studentCourseCreditsInOodi)
    
    // duplicates were created by old updater
    await removePossibleDuplicatesFromOodikone(student)

  } catch (e) {
    logger.error('ERROR: Student: ' + student.studentnumber + ' could not create credit for course ')
  }

  return newCredits
}

const removedNonexistentCreditsFromOodikone = async (student, oodiCredits) => {

  const nonExisting = []
  for (let i = 0; i < student.credits.length; i++) {
    const course = student.credits[i]
    const matching = oodiCredits.find(util.codeAndDateMatchesOodiKone(course))
    if (matching===undefined) {
      nonExisting.push(course)
    }
  }  

  if (nonExisting.length===0) {
    return 
  }

  logger.verbose('Removing nonexistent courses from OodiKone')
  for (let i = 0; i < nonExisting.length; i++) {
    const course = nonExisting[i]
    logger.verbose(`Removed ${course.courseinstance.course.name} ${course.courseinstance.course_code} ${util.toDate(course.courseinstance.coursedate)} ${course.grade} ${course.credits} op`)
    await course.destroy()
  }

}

const removePossibleDuplicatesFromOodikone = async (student) => {
  const byCodeAndDate = (course) =>
    `${course.courseinstance.course_code};${util.toDate(course.courseinstance.coursedate)}`

  const hasCodeAndDate = (c, d) => (course) =>
    c === course.courseinstance.course_code && d === util.toDate(course.courseinstance.coursedate)

  const creditsGroupped = _.groupBy(student.credits.filter(Credit.passed), byCodeAndDate)
  const keys = Object.keys(creditsGroupped)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]

    if (creditsGroupped[key].length > 1) {
      const [ code, date ] = key.split(';')
      logger.verbose(`removing duplicate entries of ${code} ${date}`)
      const duplicates = student.credits.filter(hasCodeAndDate(code, date))
      for (let j = 1; j < duplicates.length; j++) {
        await duplicates[j].destroy()
      }
    }

  }
}

const studentAlreadyHasCredit = async (student, oodiCredit) => {

  try {
    // get the course code of the credit from Oodi
    const creditCode = oodiCredit.courseInstance.course.courseCode
    const creditDate = getDate(oodiCredit.courseInstance.date)

    for (let i = 0; i < student.credits.length; i++) {
      const studentCredit = student.credits[i]

      const instanceCode = studentCredit.courseinstance.course_code
      const instanceDate = studentCredit.courseinstance.coursedate
      
      // compare codes and grades
      if (creditCode === instanceCode && creditDate === instanceDate) {

        // if the oodi grade is better, update it
        if (parseInt(oodiCredit.grade) && parseInt(oodiCredit.grade) > studentCredit.grade) {  
          try {
            await CreditService.updateCreditGrade(studentCredit, oodiCredit.grade)
            logger.verbose('Student: ' + student.studentnumber + ' course instance with code ' + instanceCode + ' credit grade updated: ' + studentCredit.grade + ' => ' + oodiCredit.grade)
          } catch (e) {
            logger.error('Student: ' + student.studentnumber + ' course instance with code ' + instanceCode + ' credit grade update ' + studentCredit.grade + ' => ' + oodiCredit.grade + ' FAILED')
          }
        }
        return true
      }
    }

    return false
  } catch (e) {
    logger.error('Student: ' + student.studentnumber + ' alreadyHasCredit check FAILED')
  }
}

const loadAndUpdateStudent = async studentNumber => {
  try {
    let [ student, studentFromOodi ] = await Promise.all([
      StudentService.byId(studentNumber), Oodi.getStudent(studentNumber)
    ])

    if (studentFromOodi === null) {
      return null
    }
    
    if (student === null) {
      try {
        student = await StudentService.createStudent(studentFromOodi)
        logger.verbose('Student ' + studentNumber + ' created to database')
        return [student, studentFromOodi]
      } catch (e) {
        logger.error('Student ' + studentNumber + ': creation failed, error message:')
        return null
      }
    }

    const oodiLastCreditDate = studentFromOodi[21] !== null ? 
      getDate(studentFromOodi[21], 'DD.MM.YYYY') : null
    
    if (oodiLastCreditDate === null ||
      oodiLastCreditDate === getDate(student.dataValues.dateoflastcredit, 'YYYY-MM-DD')) {
      return student
    }

    try {
      await StudentService.updateStudent(studentFromOodi)
      logger.verbose('Student ' + studentNumber + ': details updated')
    } catch (e) {
      logger.error('Student ' + studentNumber + ': update failed')
    }

    return student
  } catch (e) {
    logger.error('Student: ' + studentNumber + ' loadAndUpdate failed')
  }
}

const run = async () => {
  const STUDENT_SET_KEY = process.env.STUDENT_SET || 'cached_students'
  const STEP = process.env.STEP || 1000 
  const FROM = process.env.UPDATE_STUDENTS_FROM 
  const TO = process.env.UPDATE_STUDENTS_TO    

  const stats = {
    studyRights: 0,
    credits: 0,
    creditsUpdated: 0,
    students: 0
  }

  let cached = await StudentList.findOne({
    where: { key: STUDENT_SET_KEY }
  })

  const limit = (FROM && TO) ? `updating ${FROM} - ${TO}` : 'updating all' 

  logger.info(cached.student_numbers.length, 'students numbers in range', cached.description, limit)

  for (let i = 0; i < cached.student_numbers.length; i++) {
    const student_number = cached.student_numbers[i]

    if ( FROM && TO && (FROM > Number(student_number) || TO < Number(student_number))) {
      continue
    }

    if (i % STEP === 1) {
      logger.info('Running student', i, 'number', cached.student_numbers[i])
    }

    const [ studyRights, credits ] = await updateStudentInformation(student_number)
    
    stats.studyRights += studyRights
    stats.credits += credits
    stats.students += 1
    stats.creditsUpdated += credits > 0 ? 1 : 0
  } 

  logger.info(stats)
  logger.info('update completed')

  process.exit(0)
 
}

run()