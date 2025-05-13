import type { Name } from '../types'

import type { CourseType } from './courseType'
import type { Credit } from './credit'
import type { Enrollment } from './enrollment'
import type { Organization } from './organization'

export type Course = {
  id: string
  code: string
  coursetypecode: string
  courseType: CourseType
  credits: Credit[]
  enrollments: Enrollment[]
  organizations: Organization[]
  is_study_module: boolean
  name: Name
  max_attainment_date: Date
  min_attainment_date: Date
  createdAt: Date
  updatedAt: Date
  substitutions: string[]
  course_unit_type: string
  mainCourseCode: string
}
