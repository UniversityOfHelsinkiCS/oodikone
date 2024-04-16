const { Credit, Enrollment, Student, Course } = require('../models')
const { Op, where, fn, col } = require('sequelize')

const getCompletedCourses = async (studentNumbers, courseCodes) => {
  let courses = await Course.findAll({
    attributes: ['code', 'name', 'substitutions'],
    where: where(fn('LOWER', col('code')), {
      [Op.in]: courseCodes.map(code => code.toLowerCase()),
    }),
  })

  const fullCourseCodes = [
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
      courseCode: originalCode || course_code,
      substitution: originalCode ? course_code : null,
      studentNumber: student_studentnumber,
      creditType: credittypecode,
      date: attainment_date,
    }
  })

  enrollments = enrollments.map(enrollment => {
    const originalCode = courses.find(course => course.substitutions.includes(enrollment.course_code))?.code
    return {
      courseCode: originalCode || enrollment.course_code,
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
    }
    if (previous) {
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
      substitution: enrollment.substitution,
    })
  })

  const students = Object.keys(studentCredits).reduce(
    (acc, student) => [
      ...acc,
      {
        studentNumber: student,
        sis_person_id: studentCredits[student].sis_person_id,
        credits: studentCredits[student].credits,
        enrollments: {},
        allEnrollments: studentCredits[student].enrollments,
        firstnames: studentCredits[student].firstnames,
        lastname: studentCredits[student].lastname,
        email: studentCredits[student].email,
      },
    ],
    []
  )

  students.forEach(student => {
    courseCodes.forEach(courseCode => {
      // TODO: Fix this, sort function always takes two parameters
      // eslint-disable-next-line prefer-destructuring
      student.enrollments[courseCode] = student.allEnrollments
        .filter(e => e.courseCode === courseCode || e.substitution === courseCode)
        .sort(e => new Date(e.date).getDate())[0]
    })
  })

  // Omit allEnrollments, we're only supposed to show the recent, relevant enrollment,
  // the user does not have rights to see all enrollments.
  return {
    students: students.map(student => {
      const { allEnrollments, ...rest } = student
      return { ...rest }
    }),
    courses,
  }
}

module.exports = { getCompletedCourses }
