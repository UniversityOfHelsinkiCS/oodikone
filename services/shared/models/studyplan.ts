import type { SISStudyRight } from './SISStudyRight'
import type { Student } from './student'

export type Studyplan = {
  id: string
  studentnumber: string
  student: Student
  sis_study_right_id: string
  studyRight: SISStudyRight
  programme_code: string
  included_courses: string[]
  includedModules: string[]
  sisu_id: string
  completed_credits: number
  curriculum_period_id: string
  createdAt: Date
  updatedAt: Date
}
