const moment = require('moment')
const { getCredits, getStudyRights, getEnrollments, getStudentInfo, getCourseNames } = require('./openUniSearches')

const uniq = objects => [...new Set(objects)]

const getCustomOpenUniCourses = async (courseCodes, startdate, enddate) => {
  const ayCourseCodes = courseCodes.map(courseCode => 'AY' + courseCode)
  const allCourseCodes = courseCodes.concat(ayCourseCodes)
  const allCredits = await getCredits(allCourseCodes, startdate)
  const allEnrollments = await getEnrollments(allCourseCodes, startdate, enddate)
  const students = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentnumber))
  const courses = await getCourseNames(courseCodes)

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
      enrolledPassed: null,
      enrolledNotPassed: [],
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
          passedTotal: 0,
          enrolledTotal: 0,
        }
      }
      const passedCourses = []
      const unfinishedCourses = []
      for (const { course_code, attainment_date, student_studentnumber } of allCredits) {
        if (student_studentnumber === studentnumber) {
          const courseCode = course_code.replace('AY', '')
          studentStats[studentnumber].courseInfo[courseCode].enrolledPassed = attainment_date
          if (!passedCourses.includes(courseCode)) {
            passedCourses.push(courseCode)
          }
        }
      }
      for (const { enrollmentStudentnumber, course_code, enrollment_date_time } of allEnrollments) {
        if (enrollmentStudentnumber === studentnumber) {
          const courseCode = course_code.replace('AY', '')
          if (!studentStats[studentnumber].courseInfo[courseCode].enrolledPassed && studentnumber === studentnumber) {
            studentStats[studentnumber].courseInfo[courseCode].enrolledNotPassed.push(enrollment_date_time)
            if (!unfinishedCourses.includes(courseCode)) unfinishedCourses.push(courseCode)
          }
        }
      }
      studentStats[studentnumber].passedTotal = passedCourses.length
      studentStats[studentnumber].enrolledTotal = unfinishedCourses.length
    }
  }
  const openUniStats = { students: studentStats, courses: courses }
  return openUniStats
}

module.exports = { getCustomOpenUniCourses }
