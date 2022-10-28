const moment = require('moment')
const { getCredits, getStudyRights, getEnrollments, getStudentInfo } = require('./openUniSearches')
/* IF NOT NEEDED REMOVE THIS
const checkStudyrights = (studyrights, date) => {
  const within = (right, date) => {
    const first = moment(right.startdate)
    const last = moment(right.enddate)
    return first.isSameOrBefore(date) && last.isSameOrAfter(date)
  }
  return studyrights.find(studyright => within(studyright, date))
}
*/
const uniq = objects => [...new Set(objects)]

const getCustomOpenUniCourses = async courseCodes => {
  const ayCourseCodes = courseCodes.map(courseCode => 'AY-' + courseCode)
  const allCourseCodes = courseCodes.concat(ayCourseCodes)
  const allCredits = await getCredits(allCourseCodes)
  const allEnrollments = await getEnrollments(allCourseCodes)
  const students = uniq(allEnrollments.map(enrollment => enrollment.enrollmentStudentnumber))

  const allStudyrights = await getStudyRights(students)
  const studentInfo = await getStudentInfo(students)
  const studentsWithCurrentStudyRight = allStudyrights
    .filter(
      right =>
        (moment(right.startdate).isBetween('2020-08-01', moment()) &&
          !moment(right.enddate).isBetween('2020-08-01', moment())) ||
        (moment(right.startdate).isSameOrBefore('2020-08-01') && moment(right.enddate).isSameOrAfter(moment()))
    )
    .map(right2 => right2.studentnumber)

  const studentStats = {}
  for (const { studentnumber, email, secondary_email } of studentInfo) {
    // StudyRight checking: student has some studyright now? if yes, then stop here
    if (studentnumber in studentsWithCurrentStudyRight) return

    if (!(studentnumber in studentStats)) {
      studentStats[studentnumber] = {
        courseInfo: {},
        email: email,
        secondaryEmail: secondary_email,
      }
    }
    for (const { course_code, attainment_date, student_studentnumber } of allCredits) {
      if (student_studentnumber === studentnumber) {
        if (!(course_code in studentStats[studentnumber].courseInfo)) {
          studentStats[studentnumber].courseInfo[course_code] = {
            enrolledPassed: null,
            enrolledNotPassed: [],
            notEnrolled: false,
          }
        }
        studentStats[studentnumber].courseInfo[course_code].enrolledPassed = attainment_date
      }
    }
    for (const { enrollmentStudentnumber, course_code, enrollment_date_time } of allEnrollments) {
      if (enrollmentStudentnumber === studentnumber) {
        if (!(course_code in studentStats[studentnumber].courseInfo)) {
          studentStats[studentnumber].courseInfo[course_code] = {
            enrolledPassed: null,
            enrolledNotPassed: [],
            notEnrolled: false,
          }
        }
        if (!studentStats[studentnumber].courseInfo[course_code].enrolledPassed && studentnumber === studentnumber) {
          // enrolledPassed, enrolledNotPassed, notEnrolled
          studentStats[studentnumber].courseInfo[course_code].enrolledNotPassed.push(enrollment_date_time)
        }
        if (
          studentStats[studentnumber].courseInfo[course_code].enrolledNotPassed.length === 0 &&
          !studentStats[studentnumber].courseInfo[course_code].enrolledPassed &&
          studentnumber === studentnumber
        ) {
          studentStats[studentnumber].courseInfo[course_code].notEnrolled = true
        }
      }
    }
  }
  return studentStats
}

module.exports = { getCustomOpenUniCourses }
