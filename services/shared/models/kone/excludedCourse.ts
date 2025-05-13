import type { Optional } from '../../types'

export type ExcludedCourseCreation = Optional<ExcludedCourse, 'id' | 'createdAt' | 'updatedAt'>
export type ExcludedCourse = {
  id: number
  programme_code: string
  course_code: string
  curriculum_version: string
  createdAt: Date
  updatedAt: Date
}
