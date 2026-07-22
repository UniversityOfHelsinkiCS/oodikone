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
  codes: string[]
  separate: string
  combineSubstitutions: string
  fromYearCode: string
  toYearCode: string
}
