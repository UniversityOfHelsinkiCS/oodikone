import { Name } from '@oodikone/shared/types'

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
  includeSpecial?: boolean
}
