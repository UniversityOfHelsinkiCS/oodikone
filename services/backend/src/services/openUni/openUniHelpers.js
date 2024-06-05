const mapOpenCredits = credit => {
  const { course_code, attainment_date, student_studentnumber, grade } = credit
  return {
    course_code,
    attainment_date,
    student_studentnumber,
    grade,
  }
}

const mapStudentInfo = student => {
  const { email, secondary_email, studentnumber } = student
  return {
    studentnumber,
    email,
    secondary_email,
  }
}
const mapOpenEnrollments = enrollment => {
  const { studentnumber, course_code, state, enrollment_date_time } = enrollment
  return {
    enrollmentStudentnumber: studentnumber,
    course_code,
    state,
    enrollment_date_time,
  }
}

const mapStudyRights = studyright => {
  const { enddate, startdate, student } = studyright
  return {
    startdate,
    enddate,
    studyrightStudentnumber: student.studentnumber,
  }
}

const mapCourseInfo = course => {
  const { code, name } = course
  return {
    label: code,
    name,
  }
}

module.exports = { mapOpenCredits, mapOpenEnrollments, mapStudentInfo, mapStudyRights, mapCourseInfo }
