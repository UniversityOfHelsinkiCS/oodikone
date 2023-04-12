const { Credit, Enrollment } = require('../models')
const { Op } = require('sequelize')
const _ = require('lodash')

const getCompletedCourses = async (studentNumbers, courseCodes) => {
  let credits = await Credit.findAll({
    attributes: ['course_code', 'student_studentnumber', 'credittypecode'],
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
    attributes: ['course_code', 'enrollment_date_time', 'studentnumber'],
    where: {
      course_code: {
        [Op.in]: courseCodes,
      },
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })

  credits = credits.map(credit => {
    const { course_code, student_studentnumber, credittypecode } = credit
    return { courseCode: course_code, studentNumber: student_studentnumber, creditType: credittypecode }
  })

  enrollments = enrollments.map(enrollment => {
    return {
      courseCode: enrollment.course_code,
      studentNumber: enrollment.studentnumber,
      date: enrollment.enrollment_date_time,
    }
  })

  const createFieldsIfNeeded = student => {
    if (!studentCredits[student]) {
      studentCredits[student] = { credits: [], enrollments: [] }
    }
  }

  const studentCredits = {}

  credits.forEach(credit => {
    createFieldsIfNeeded(credit.studentNumber)
    studentCredits[credit.studentNumber].credits.push({
      courseCode: credit.courseCode,
      creditType: credit.creditType,
    })
  })

  enrollments.forEach(enrollment => {
    createFieldsIfNeeded(enrollment.studentNumber)
    if (credits.find(credit => credit.courseCode === enrollment.courseCode)) {
      return
    }
    if (enrollment.date === null) {
      return
    }
    studentCredits[enrollment.studentNumber].enrollments.push({
      date: enrollment.date,
      courseCode: enrollment.courseCode,
    })
  })

  const students = Object.keys(studentCredits).reduce(
    (acc, student) => [
      ...acc,
      {
        studentNumber: student,
        credits: studentCredits[student].credits,
        enrollments: studentCredits[student].enrollments,
      },
    ],
    []
  )

  courseCodes = [...new Set(courseCodes)]

  // Choose the latest enrollment and throw others out
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

  return { students, courseCodes }
}

module.exports = { getCompletedCourses }
