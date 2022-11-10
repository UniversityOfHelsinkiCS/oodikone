const mapOpenCredits = credit => {
  const { course_code, attainment_date, student_studentnumber } = credit
  return {
    course_code,
    attainment_date,
    student_studentnumber,
  }
}

const mapStundentInfo = student => {
  const { email, secondary_email, studentnumber, dissemination_info_allowed } = student
  return {
    studentnumber,
    email,
    secondary_email,
    dissemination_info_allowed,
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
module.exports = { mapOpenCredits, mapOpenEnrollments, mapStundentInfo, mapStudyRights }
