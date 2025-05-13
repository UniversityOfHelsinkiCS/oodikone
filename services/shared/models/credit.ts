import { CreditTypeCode } from '../types'

import type { Course } from './course'
import type { CreditType } from './creditType'
import type { Semester } from './semester'
import type { SISStudyRight } from './SISStudyRight'
import type { Student } from './student'
import type { Teacher } from './teacher'

export type Credit = {
  id: string
  grade: string
  student_studentnumber: string
  student: Student
  semester: Semester
  credits: number
  credittypecode: CreditTypeCode
  creditType: CreditType
  createdate: Date
  attainment_date: Date
  teachers: Teacher[]
  course_code: string
  course: Course
  course_id: string
  semester_composite: string
  semestercode: number
  isStudyModule: boolean
  org: string
  language: string
  is_open: boolean
  studyright_id: string
  studyright: SISStudyRight
  createdAt: Date
  updatedAt: Date
}
