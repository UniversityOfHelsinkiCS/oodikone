/* eslint-disable import-x/no-unused-modules */
import type { Optional } from '../../types'

export type ExcludedCourseCreation = Optional<ExcludedCourse, 'id' | 'createdAt' | 'updatedAt'>
export type ExcludedCourse = {
  id: number
  programme_code: string
  // TODO: Remove course_code once all rows have been migrated to course_group_id
  course_code: string | null
  course_group_id: string | null
  curriculum_version: string
  createdAt: Date
  updatedAt: Date
}
