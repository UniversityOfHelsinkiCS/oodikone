const { Credit, Enrollment, Student, Course } = require('../models')
const { Op } = require('sequelize')
const _ = require('lodash')

const getCompletedCourses = async (studentNumbers, courseCodes) => {
  let courses = await Course.findAll({
    attributes: ['code', 'name'],
    where: {
      code: {
        [Op.in]: courseCodes,
      },
    },
  })

  let credits = await Credit.findAll({
    attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'attainment_date'],
    where: {
      course_code: {
        [Op.in]: courseCodes,
      },
      student_studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })

  let enrollments = await Enrollment.findAll({
    attributes: ['course_code', 'enrollment_date_time', 'studentnumber', 'state'],
    where: {
      course_code: {
        [Op.in]: courseCodes,
      },
      studentnumber: {
        [Op.in]: studentNumbers,
      },
      state: {
        [Op.eq]: 'ENROLLED',
      },
    },
  })

  const studentInfo = await Student.findAll({
    attributes: ['studentnumber', 'firstnames', 'lastname', 'email'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })

  courses = courses.map(course => {
    const { code, name } = course
    return { code, name }
  })

  credits = credits.map(credit => {
    const { course_code, student_studentnumber, credittypecode, attainment_date } = credit
    return {
      courseCode: course_code,
      studentNumber: student_studentnumber,
      creditType: credittypecode,
      date: attainment_date,
    }
  })

  enrollments = enrollments.map(enrollment => {
    return {
      courseCode: enrollment.course_code,
      studentNumber: enrollment.studentnumber,
      date: enrollment.enrollment_date_time,
    }
  })

  const studentCredits = {}

  studentInfo.forEach(s => {
    if (!studentCredits[s.studentnumber]) {
      studentCredits[s.studentnumber] = { credits: [], enrollments: [] }
    }
    studentCredits[s.studentnumber].firstNames = s.firstnames
    studentCredits[s.studentnumber].lastName = s.lastname
    studentCredits[s.studentnumber].email = s.email
  })

  credits.forEach(credit => {
    if (credit.creditType === 9) {
      return
    }
    const previous = studentCredits[credit.studentNumber].credits?.find(c => credit.courseCode === c.courseCode)
    if (previous && previous.date > credit.date) {
      return
    } else if (previous) {
      studentCredits[credit.studentNumber].credits = studentCredits[credit.studentNumber].credits.filter(
        c => credit.courseCode !== c.courseCode
      )
    }
    studentCredits[credit.studentNumber].credits.push({
      date: credit.date,
      courseCode: credit.courseCode,
      creditType: credit.creditType,
    })
  })

  enrollments.forEach(enrollment => {
    if (credits.find(credit => credit.courseCode === enrollment.courseCode)) {
      return
    }
    studentCredits[enrollment.studentNumber].enrollments.push({
      date: enrollment.date,
      courseCode: enrollment.courseCode,
      state: enrollment.state,
    })
  })

  const students = Object.keys(studentCredits).reduce(
    (acc, student) => [
      ...acc,
      {
        studentNumber: student,
        credits: studentCredits[student].credits,
        enrollments: studentCredits[student].enrollments,
        firstNames: studentCredits[student].firstNames,
        lastName: studentCredits[student].lastName,
        email: studentCredits[student].email,
      },
    ],
    []
  )

  students.forEach(student => {
    courseCodes.forEach(courseCode => {
      let [hits, rest] = _.partition(student.enrollments, e => e.courseCode === courseCode)
      if (hits?.length === 0) return
      let latest = hits[0]
      for (let hit of hits) {
        if (hit > latest) {
          latest = hit
        }
      }
      student.enrollments = [latest, ...rest]
    })
  })
  return { students, courses }
}

module.exports = { getCompletedCourses }
