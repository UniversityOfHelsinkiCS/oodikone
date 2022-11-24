const moment = require('moment')
const { getCredits, getStudyRights, getEnrollments, getStudentInfo, getCourseNames } = require('./openUniSearches')

const uniq = objects => [...new Set(objects)]

const calulateTotalsForStudent = async (studentStats, studentnumber) => {
  Object.keys(studentStats[studentnumber].courseInfo).forEach(course => {
    if (studentStats[studentnumber].courseInfo[course].status.passed) {
      studentStats[studentnumber].totals.passed += 1
    } else if (studentStats[studentnumber].courseInfo[course].status.failed) {
      studentStats[studentnumber].totals.failed += 1
    } else if (studentStats[studentnumber].courseInfo[course].status.unfinished) {
      studentStats[studentnumber].totals.unfinished += 1
    }
  })
}
const getCustomOpenUniCourses = async (courseCodes, startdate, enddate) => {
  const ayCourseCodes = courseCodes.map(courseCode => 'AY' + courseCode)
  const allCourseCodes = courseCodes.concat(ayCourseCodes)
  const allCredits = await getCredits(allCourseCodes, startdate)
  const allEnrollments = await getEnrollments(allCourseCodes, startdate, enddate)
  const students = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentnumber))
  const courses = await getCourseNames(courseCodes)
  const passedGrades = ['1', '2', '3', '4', '5', 'Hyv.', 'hyv.', 'HT', 'TT']
  const failedGrades = ['Hyl.', 'HYL', '0']

  const allStudyrights = await getStudyRights(students)
  const studentInfo = await getStudentInfo(students)
  // Filter out current studyrights:
  // Case 1: Both startdate and enddate are outside of the given interval
  // Case 2: Startdate is inside of the given interval and enddate is outside
  // Case 3: Startdate is before the interval start and the enddate is within the interval
  const studentsWithCurrentStudyRight = allStudyrights
    .filter(
      right =>
        moment(right.startdate).isBetween(startdate, moment()) ||
        (moment(right.startdate).isSameOrBefore(startdate) && moment(right.enddate).isSameOrAfter(moment())) ||
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

  for (const { studentnumber, email, secondary_email, dissemination_info_allowed } of studentInfo) {
    // Check if the student has existing studyright: if yes, then stop here
    if (!uniqueStudentsWithCurrentStudyRight.includes(studentnumber)) {
      if (!(studentnumber in studentStats)) {
        studentStats[studentnumber] = {
          courseInfo: courseCodes.reduce((acc, code) => ({ ...acc, [code]: getEmptyCourseInfo() }), {}),
          email: email,
          secondaryEmail: secondary_email,
          disseminationInfoAllowed: dissemination_info_allowed,
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
      await calulateTotalsForStudent(studentStats, studentnumber)
    }
  }
  const openUniStats = { students: studentStats, courses: courses }
  return openUniStats
}

module.exports = { getCustomOpenUniCourses }
