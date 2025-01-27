import { Name } from '@/shared/types'
import { CourseStat } from '@/types/courseStat'

export type GetCourseSearchResultResponse = {
  courses: Array<{
    code: string
    course_unit_type: string
    coursetypecode: string
    createdAt: string
    id: string
    is_study_module: boolean
    mainCourseCode: string | null
    max_attainment_date: string
    min_attainment_date: string
    name: Name
    subsId: number
    substitutions: string[]
    updatedAt: string
  }>
}

export type GetCourseSearchResultRequest = {
  name?: string
  code?: string
  combineSubstitutions?: boolean
}

export type GetSingleCourseStatsResponse = {
  openStats: CourseStat
  regularStats: CourseStat
  unifyStats: CourseStat
}

export type GetSingleCourseStatsRequest = {
  courseCodes: string[]
  separate: boolean
  combineSubstitutions: boolean
}
