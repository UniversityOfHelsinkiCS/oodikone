import type { EnrollmentState } from '../types'

import type { Course } from './course'
import type { Semester } from './semester'
import type { SISStudyRight } from './SISStudyRight'
import type { Student } from './student'

export type Enrollment = {
  id: string
  studentnumber: string
  student: Student
  course_code: string
  state: EnrollmentState
  enrollment_date_time: Date
  course_id: string
  semester_composite: string
  semester: Semester
  semestercode: number
  is_open: boolean
  studyright_id: string
  studyright: SISStudyRight
  course: Course
  createdAt: Date
  updatedAt: Date
}
