import { CourseWithSubsId } from '../types/course'

export type CoursesMultiReqBody = never
export type CoursesMultiResBody = { courses: CourseWithSubsId[] }
export type CoursesMultiQuery = {
  name: string
  code: string
  combineSubstitutions: string
}

export type CourseYearlyStatsReqBody = never
export type CourseYearlyStatsQuery = {
  codes: string[]
  separate: string
  combineSubstitutions: string
}
