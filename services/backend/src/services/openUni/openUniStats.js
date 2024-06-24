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
  const students = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentnumber))
  const courses = await getCourseNames(courseCodes)
  const passedGrades = ['1', '2', '3', '4', '5', 'Hyv.', 'hyv.', 'HT', 'TT']
  const failedGrades = ['Hyl.', 'HYL', '0']

  const allStudyRights = await getStudyRights(students)
  const studentInfo = await getStudentInfo(students)
  // Filter out current studyrights:
  // Case 1: Both startdate and enddate are outside of the given interval
  // Case 2: Startdate is inside of the given interval and enddate is outside
  // Case 3: Startdate is before the interval start and the enddate is within the interval
  const studentsWithCurrentStudyRight = allStudyRights
    .filter(
      right =>
        moment(right.startdate).isBetween(startDate, moment()) ||
        (moment(right.startdate).isSameOrBefore(startDate) && moment(right.enddate).isSameOrAfter(moment())) ||
        moment(right.enddate).isSameOrBefore(moment())
    )
    .map(right => right.studyrightStudentnumber)
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

  for (const { studentnumber, email, secondary_email } of studentInfo) {
    // Check if the student has existing studyright: if yes, then stop here
    if (!uniqueStudentsWithCurrentStudyRight.includes(studentnumber)) {
      if (!(studentnumber in studentStats)) {
        studentStats[studentnumber] = {
          courseInfo: courseCodes.reduce(
            (acc, code) => ({ ...acc, [code.replace('AY', '')]: getEmptyCourseInfo() }),
            {}
          ),
          email,
          secondaryEmail: secondary_email,
          totals: { passed: 0, failed: 0, unfinished: 0 },
        }
      }
      for (const { course_code, attainment_date, student_studentnumber, grade } of allCredits) {
        if (student_studentnumber === studentnumber) {
          const courseCode = course_code.replace('AY', '')
          if (
            passedGrades.includes(grade) &&
            (!studentStats[studentnumber].courseInfo[courseCode].status.passed ||
              moment(studentStats[studentnumber].courseInfo[courseCode].status.passed).isBefore(attainment_date, 'day'))
          ) {
            studentStats[studentnumber].courseInfo[courseCode].status.passed = attainment_date
          } else if (
            failedGrades.includes(grade) &&
            !studentStats[studentnumber].courseInfo[courseCode].status.passed &&
            (!studentStats[studentnumber].courseInfo[courseCode].status.failed ||
              moment(studentStats[studentnumber].courseInfo[courseCode].status.failed).isBefore(attainment_date, 'day'))
          ) {
            studentStats[studentnumber].courseInfo[courseCode].status.failed = attainment_date
          }
        }
      }
      for (const { enrollmentStudentnumber, course_code, enrollment_date_time } of allEnrollments) {
        if (enrollmentStudentnumber === studentnumber) {
          const courseCode = course_code.replace('AY', '')
          if (
            !studentStats[studentnumber].courseInfo[courseCode].status.passed &&
            !studentStats[studentnumber].courseInfo[courseCode].status.failed &&
            (!studentStats[studentnumber].courseInfo[courseCode].status.unfinished ||
              moment(studentStats[studentnumber].courseInfo[courseCode].status.unfinished).isBefore(
                enrollment_date_time,
                'day'
              ))
          ) {
            studentStats[studentnumber].courseInfo[courseCode].status.unfinished = enrollment_date_time
          }
        }
      }
      await calculateTotalsForStudent(studentStats, studentnumber)
    }
  }
  const openUniStats = { students: studentStats, courses }
  return openUniStats
}

module.exports = { getCustomOpenUniCourses }
