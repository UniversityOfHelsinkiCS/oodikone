import { Course } from '../models'
import { CourseWithSubsDetails } from '../types/course'

export type CoursesMultiReqBody = never
export type CoursesMultiResBody = { courses: CourseWithSubsDetails[] }
export type CoursesMultiQuery = {
  name: string
  code: string
  combineSubstitutions: string
  includeSpecial: string
}

export type CourseYearlyStatsReqBody = never
export type CourseYearlyStatsQuery = {
  courses: string | string[] // Non-array when only one course
  separate: string
  substitutions: string
  fromYearCode: string
  toYearCode: string
}

export type CourseDetailsQuery = {
  courses: string | string[]
}

export type CourseDetails = Pick<Course, 'groupId' | 'code' | 'name' | 'substitutionGroups'>[]
