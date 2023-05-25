const { Credit, Enrollment, Student, Course } = require('../models')
const { Op } = require('sequelize')
const _ = require('lodash')

const getCompletedCourses = async (studentNumbers, courseCodes) => {
  let courses = await Course.findAll({
    attributes: ['code', 'name', 'substitutions'],
    where: {
      code: {
        [Op.in]: courseCodes,
      },
    },
  })

  let fullCourseCodes = [
    ...courseCodes,
    ...new Set([...courses.reduce((acc, course) => [...acc, course.code, ...course.substitutions], [])]),
  ]

  let credits = await Credit.findAll({
    attributes: ['course_code', 'student_studentnumber', 'credittypecode', 'attainment_date'],
    where: {
      course_code: {
        [Op.in]: fullCourseCodes,
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
        [Op.in]: fullCourseCodes,
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
    attributes: ['studentnumber', 'firstnames', 'lastname', 'email', 'sis_person_id'],
    where: {
      studentnumber: {
        [Op.in]: studentNumbers,
      },
    },
  })

  courses = courses.map(course => {
    const { code, name, substitutions } = course
    return { code, name, substitutions }
  })

  credits = credits.map(credit => {
    const { course_code, student_studentnumber, credittypecode, attainment_date } = credit
    const originalCode = courseCodes.includes(course_code)
      ? null
      : courses.find(course => course.substitutions.includes(course_code))?.code
    return {
      courseCode: originalCode ? originalCode : course_code,
      substitution: originalCode ? course_code : null,
      studentNumber: student_studentnumber,
      creditType: credittypecode,
      date: attainment_date,
    }
  })

  enrollments = enrollments.map(enrollment => {
    const originalCode = courses.find(course => course.substitutions.includes(enrollment.course_code))?.code
    return {
      courseCode: originalCode ? originalCode : enrollment.course_code,
      substitution: originalCode ? enrollment.course_code : null,
      studentNumber: enrollment.studentnumber,
      date: enrollment.enrollment_date_time,
    }
  })

  const studentCredits = {}

  studentInfo.forEach(s => {
    if (!studentCredits[s.studentnumber]) {
      studentCredits[s.studentnumber] = { credits: [], enrollments: [] }
    }
    studentCredits[s.studentnumber].firstnames = s.firstnames
    studentCredits[s.studentnumber].lastname = s.lastname
    studentCredits[s.studentnumber].email = s.email
    studentCredits[s.studentnumber].sis_person_id = s.sis_person_id
  })

  credits.forEach(credit => {
    if (credit.creditType === 10) {
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
      substitution: credit.substitution,
    })
  })

  enrollments.forEach(enrollment => {
    if (
      credits.find(
        credit => credit.courseCode === enrollment.courseCode && credit.studentNumber === enrollment.studentNumber
      )
    ) {
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
        sis_person_id: studentCredits[student].sis_person_id,
        credits: studentCredits[student].credits,
        enrollments: studentCredits[student].enrollments,
        firstnames: studentCredits[student].firstnames,
        lastname: studentCredits[student].lastname,
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
