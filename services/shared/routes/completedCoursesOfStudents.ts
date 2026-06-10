import type { CompletedCoursesCourse, CompletedCoursesStudent } from '../types'

export type CompletedCoursesRes = {
  discardedStudentNumbers: string[]
  students: Omit<CompletedCoursesStudent, 'allEnrollments'>[]
  courses: CompletedCoursesCourse[]
}
