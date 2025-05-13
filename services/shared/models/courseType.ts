import type { Name } from '../types'

import type { Course } from './course'

export type CourseType = {
  coursetypecode: string
  courses: Course[]
  name: Required<Name>
  createdAt: Date
  updatedAt: Date
}
