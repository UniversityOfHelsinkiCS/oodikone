import { Unarray } from '@oodikone/shared/types'
import { CourseWithSubsDetails } from '@oodikone/shared/types/course'

export type SearchResultCourse = Unarray<GetCourseSearchResultResponse['courses']>

export type GetCourseSearchResultResponse = {
  courses: Array<Omit<CourseWithSubsDetails, 'courseType' | 'credits' | 'enrollments' | 'organizations'>>
}

export type GetCourseSearchResultRequest = {
  name?: string
  code?: string
  combineSubstitutions?: boolean
  includeSpecial?: boolean
}
