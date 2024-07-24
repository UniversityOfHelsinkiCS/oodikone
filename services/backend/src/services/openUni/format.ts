import { Course, Credit, Enrollment, Student } from '../../models'

export const formatCourseInfo = (course: Course) => {
  return {
    label: course.code,
    name: course.name,
  }
}

export const formatOpenCredits = (credit: Credit) => {
  return {
    attainmentCourseCode: credit.course_code,
    attainmentDate: credit.attainment_date,
    attainmentGrade: credit.grade,
    attainmentStudentNumber: credit.student_studentnumber,
  }
}

export const formatOpenEnrollments = (enrollment: Enrollment) => {
  return {
    enrollmentCourseCode: enrollment.course_code,
    enrollmentDateTime: enrollment.enrollment_date_time,
    enrollmentStudentNumber: enrollment.studentnumber,
  }
}

export const formatStudentInfo = (student: Student) => {
  return {
    studentNumber: student.studentnumber,
    email: student.email,
    secondaryEmail: student.secondary_email,
  }
}
