import { RTKApi } from '@/apiConnection'
import { GetCourseSearchResultRequest, GetCourseSearchResultResponse } from '@/types/api/courses'

const courseSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseSearchResult: builder.query<GetCourseSearchResultResponse, GetCourseSearchResultRequest>({
      query: ({ name, code, combineSubstitutions, includeSpecial }) => ({
        url: '/v2/coursesmulti',
        params: { name, code, combineSubstitutions, includeSpecial },
      }),
    }),
  }),
})

export const { useGetCourseSearchResultQuery } = courseSearchApi
