import type { Course } from './course'
import type { SISStudyRight } from './SISStudyRight'
import type { Student } from './student'

export type Studyplan = {
  id: string
  studentnumber: string
  student: Student
  sis_study_right_id: string
  studyRight: SISStudyRight
  programme_code: string

  /* These two can be deleted if/when all views use the "courses" join table */
  included_courses: string[]
  includedModules: string[]

  /* Prefer this to above arrays: easy to fetch name/code/groupId in the same sequelize query */
  courses: Course[]

  sisu_id: string
  completed_credits: number
  curriculum_period_ids: string[]
  createdAt: Date
  updatedAt: Date
}
