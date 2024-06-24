const moment = require('moment')

const { getCourseNames, getCredits, getEnrollments, getStudentInfo, getStudyRights } = require('./openUniSearches')

const uniq = objects => [...new Set(objects)]

const calculateTotalsForStudent = async (studentStats, studentNumber) => {
  Object.keys(studentStats[studentNumber].courseInfo).forEach(course => {
    if (studentStats[studentNumber].courseInfo[course].status.passed) {
      studentStats[studentNumber].totals.passed += 1
    } else if (studentStats[studentNumber].courseInfo[course].status.failed) {
      studentStats[studentNumber].totals.failed += 1
    } else if (studentStats[studentNumber].courseInfo[course].status.unfinished) {
      studentStats[studentNumber].totals.unfinished += 1
    }
  })
}

const getCustomOpenUniCourses = async (courseCodes, startDate, endDate) => {
  const ayCourseCodes = courseCodes.map(courseCode => `AY${courseCode}`)
  const allCourseCodes = courseCodes.concat(ayCourseCodes)
  const allCredits = await getCredits(allCourseCodes, startDate)
  const allEnrollments = await getEnrollments(allCourseCodes, startDate, endDate)
  const students = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentNumber))
  const courses = await getCourseNames(courseCodes)
  const passedGrades = ['1', '2', '3', '4', '5', 'Hyv.', 'hyv.', 'HT', 'TT']
  const failedGrades = ['Hyl.', 'HYL', '0']

  const allStudyRights = await getStudyRights(students)
  const studentInfo = await getStudentInfo(students)

  const isStartDateOutsideInterval = (studyRight, startDate) => {
    return moment(studyRight.startDate).isBetween(startDate, moment())
  }

  const isStartDateInsideAndEndDateOutside = (studyRight, startDate) => {
    return moment(studyRight.startDate).isSameOrBefore(startDate) && moment(studyRight.endDate).isSameOrAfter(moment())
  }

  const isEndDateBeforeNow = studyRight => moment(studyRight.endDate).isSameOrBefore(moment())

  const studentsWithCurrentStudyRight = allStudyRights
    .filter(
      studyRight =>
        isStartDateOutsideInterval(studyRight, startDate) ||
        isStartDateInsideAndEndDateOutside(studyRight, startDate) ||
        isEndDateBeforeNow(studyRight)
    )
    .map(studyRight => studyRight.studentNumber)

  const uniqueStudentsWithCurrentStudyRight = uniq(studentsWithCurrentStudyRight)

  const studentStats = {}
  const getEmptyCourseInfo = () => {
    return {
      status: {
        passed: null,
        failed: null,
        unfinished: null,
      },
    }
  }

  for (const { studentNumber, email, secondaryEmail } of studentInfo) {
    if (uniqueStudentsWithCurrentStudyRight.includes(studentNumber)) {
      continue
    }
    if (!(studentNumber in studentStats)) {
      studentStats[studentNumber] = {
        courseInfo: courseCodes.reduce((acc, code) => ({ ...acc, [code.replace('AY', '')]: getEmptyCourseInfo() }), {}),
        email,
        secondaryEmail,
        totals: { passed: 0, failed: 0, unfinished: 0 },
      }
    }
    for (const { attainmentCourseCode, attainmentDate, attainmentStudentNumber, attainmentGrade } of allCredits) {
      if (attainmentStudentNumber === studentNumber) {
        const courseCode = attainmentCourseCode.replace('AY', '')
        if (
          passedGrades.includes(attainmentGrade) &&
          (!studentStats[studentNumber].courseInfo[courseCode].status.passed ||
            moment(studentStats[studentNumber].courseInfo[courseCode].status.passed).isBefore(attainmentDate, 'day'))
        ) {
          studentStats[studentNumber].courseInfo[courseCode].status.passed = attainmentDate
        } else if (
          failedGrades.includes(attainmentGrade) &&
          !studentStats[studentNumber].courseInfo[courseCode].status.passed &&
          (!studentStats[studentNumber].courseInfo[courseCode].status.failed ||
            moment(studentStats[studentNumber].courseInfo[courseCode].status.failed).isBefore(attainmentDate, 'day'))
        ) {
          studentStats[studentNumber].courseInfo[courseCode].status.failed = attainmentDate
        }
      }
    }
    for (const { enrollmentStudentNumber, enrollmentCourseCode, enrollmentDateTime } of allEnrollments) {
      if (enrollmentStudentNumber === studentNumber) {
        const courseCode = enrollmentCourseCode.replace('AY', '')
        if (
          !studentStats[studentNumber].courseInfo[courseCode].status.passed &&
          !studentStats[studentNumber].courseInfo[courseCode].status.failed &&
          (!studentStats[studentNumber].courseInfo[courseCode].status.unfinished ||
            moment(studentStats[studentNumber].courseInfo[courseCode].status.unfinished).isBefore(
              enrollmentDateTime,
              'day'
            ))
        ) {
          studentStats[studentNumber].courseInfo[courseCode].status.unfinished = enrollmentDateTime
        }
      }
    }
    await calculateTotalsForStudent(studentStats, studentNumber)
  }
  const openUniStats = { students: studentStats, courses }
  return openUniStats
}

module.exports = { getCustomOpenUniCourses }
