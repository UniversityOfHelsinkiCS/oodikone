import { Unarray } from '@oodikone/shared/types'
import { CourseWithSubsId } from '@oodikone/shared/types/course'

export type SearchResultCourse = Unarray<GetCourseSearchResultResponse['courses']>

export type GetCourseSearchResultResponse = {
  courses: Array<Omit<CourseWithSubsId, 'courseType' | 'credits' | 'enrollments' | 'organizations'>>
}

export type GetCourseSearchResultRequest = {
  name?: string
  code?: string
  combineSubstitutions?: boolean
  includeSpecial?: boolean
}
