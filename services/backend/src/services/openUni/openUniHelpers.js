const mapCourseInfo = course => {
  const { code, name } = course
  return {
    label: code,
    name,
  }
}

const mapOpenCredits = credit => {
  const { attainment_date, course_code, grade, student_studentnumber } = credit
  return {
    attainmentCourseCode: course_code,
    attainmentDate: attainment_date,
    attainmentGrade: grade,
    attainmentStudentNumber: student_studentnumber,
  }
}

const mapOpenEnrollments = enrollment => {
  const { course_code, enrollment_date_time, studentnumber } = enrollment
  return {
    enrollmentCourseCode: course_code,
    enrollmentDateTime: enrollment_date_time,
    enrollmentStudentNumber: studentnumber,
  }
}

const mapStudentInfo = student => {
  const { studentnumber, email, secondary_email } = student
  return {
    studentNumber: studentnumber,
    email,
    secondaryEmail: secondary_email,
  }
}

module.exports = {
  mapCourseInfo,
  mapOpenCredits,
  mapOpenEnrollments,
  mapStudentInfo,
}
