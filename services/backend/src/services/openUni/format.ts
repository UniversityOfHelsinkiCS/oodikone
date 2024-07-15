export const formatCourseInfo = course => {
  return {
    label: course.code,
    name: course.name,
  }
}

export const formatOpenCredits = credit => {
  return {
    attainmentCourseCode: credit.course_code,
    attainmentDate: credit.attainment_date,
    attainmentGrade: credit.grade,
    attainmentStudentNumber: credit.student_studentnumber,
  }
}

export const formatOpenEnrollments = enrollment => {
  return {
    enrollmentCourseCode: enrollment.course_code,
    enrollmentDateTime: enrollment.enrollment_date_time,
    enrollmentStudentNumber: enrollment.studentnumber,
  }
}

export const formatStudentInfo = student => {
  return {
    studentNumber: student.studentnumber,
    email: student.email,
    secondaryEmail: student.secondary_email,
  }
}
