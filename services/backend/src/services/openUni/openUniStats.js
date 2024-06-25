const moment = require('moment')

const { getCourseNames, getCredits, getEnrollments, getStudentInfo, getStudyRights } = require('./openUniSearches')

const uniq = objects => [...new Set(objects)]

const calculateTotalsForStudent = async (studentStats, studentNumber) => {
  Object.keys(studentStats[studentNumber].courseInfo).forEach(course => {
    const { status } = studentStats[studentNumber].courseInfo[course]
    if (status.passed) {
      studentStats[studentNumber].totals.passed += 1
    } else if (status.failed) {
      studentStats[studentNumber].totals.failed += 1
    } else if (status.unfinished) {
      studentStats[studentNumber].totals.unfinished += 1
    }
  })
}

const getAllCourseCodes = courseCodes => {
  const ayCourseCodes = courseCodes.map(courseCode => `AY${courseCode}`)
  return courseCodes.concat(ayCourseCodes)
}

const isStartDateOutsideInterval = (studyRight, startDate) => {
  return moment(studyRight.startDate).isBetween(startDate, moment())
}

const isStartDateInsideAndEndDateOutside = (studyRight, startDate) => {
  return moment(studyRight.startDate).isSameOrBefore(startDate) && moment(studyRight.endDate).isSameOrAfter(moment())
}

const isEndDateBeforeNow = studyRight => moment(studyRight.endDate).isSameOrBefore(moment())

const getEmptyCourseInfo = () => ({
  status: {
    passed: null,
    failed: null,
    unfinished: null,
  },
})

const updatePassedStatus = (courseInfo, attainmentDate) => {
  if (!courseInfo.status.passed || moment(courseInfo.status.passed).isBefore(attainmentDate, 'day')) {
    courseInfo.status.passed = attainmentDate
  }
}

const updateFailedStatus = (courseInfo, attainmentDate) => {
  if (
    !courseInfo.status.passed &&
    (!courseInfo.status.failed || moment(courseInfo.status.failed).isBefore(attainmentDate, 'day'))
  ) {
    courseInfo.status.failed = attainmentDate
  }
}

const updateUnfinishedStatus = (courseInfo, enrollmentDateTime) => {
  if (
    !courseInfo.status.passed &&
    !courseInfo.status.failed &&
    (!courseInfo.status.unfinished || moment(courseInfo.status.unfinished).isBefore(enrollmentDateTime, 'day'))
  ) {
    courseInfo.status.unfinished = enrollmentDateTime
  }
}

const getCustomOpenUniCourses = async (courseCodes, startDate, endDate) => {
  const allCourseCodes = getAllCourseCodes(courseCodes)
  const allCredits = await getCredits(allCourseCodes, startDate)
  const allEnrollments = await getEnrollments(allCourseCodes, startDate, endDate)
  const courses = await getCourseNames(courseCodes)
  const students = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentNumber))
  const allStudyRights = await getStudyRights(students)
  const studentInfo = await getStudentInfo(students)

  const passedGrades = ['1', '2', '3', '4', '5', 'Hyv.', 'hyv.', 'HT', 'TT']
  const failedGrades = ['Hyl.', 'HYL', '0']

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
    const studentCourses = studentStats[studentNumber].courseInfo
    for (const { attainmentCourseCode, attainmentDate, attainmentStudentNumber, attainmentGrade } of allCredits) {
      if (attainmentStudentNumber === studentNumber) {
        const courseCode = attainmentCourseCode.replace('AY', '')
        if (passedGrades.includes(attainmentGrade)) {
          updatePassedStatus(studentCourses[courseCode], attainmentDate)
        } else if (failedGrades.includes(attainmentGrade)) {
          updateFailedStatus(studentCourses[courseCode], attainmentDate)
        }
      }
    }
    for (const { enrollmentStudentNumber, enrollmentCourseCode, enrollmentDateTime } of allEnrollments) {
      if (enrollmentStudentNumber === studentNumber) {
        const courseCode = enrollmentCourseCode.replace('AY', '')
        updateUnfinishedStatus(studentCourses[courseCode], enrollmentDateTime)
      }
    }
    await calculateTotalsForStudent(studentStats, studentNumber)
  }
  const openUniStats = { students: studentStats, courses }
  return openUniStats
}

module.exports = { getCustomOpenUniCourses }
