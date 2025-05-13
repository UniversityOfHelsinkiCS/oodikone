import { CourseModel, CreditModel, EnrollmentModel, StudentModel } from '../../models'

export const formatCourseInfo = (course: CourseModel) => {
  return {
    label: course.code,
    name: course.name,
  }
}

export const formatOpenCredits = (credit: CreditModel) => {
  return {
    attainmentCourseCode: credit.course_code,
    attainmentDate: credit.attainment_date,
    attainmentGrade: credit.grade,
    attainmentStudentNumber: credit.student_studentnumber,
  }
}

export const formatOpenEnrollments = (enrollment: EnrollmentModel) => {
  return {
    enrollmentCourseCode: enrollment.course_code,
    enrollmentDateTime: enrollment.enrollment_date_time,
    enrollmentStudentNumber: enrollment.studentnumber,
  }
}

export const formatStudentInfo = (student: StudentModel) => {
  return {
    studentNumber: student.studentnumber,
    email: student.email,
    secondaryEmail: student.secondary_email,
  }
}
