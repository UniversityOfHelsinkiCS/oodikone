import { RTKApi } from '@/apiConnection'
import { GetCourseSearchResultRequest, GetCourseSearchResultResponse } from '@/types/api/courses'

const courseSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseSearchResult: builder.query<GetCourseSearchResultResponse, GetCourseSearchResultRequest>({
      query: ({ name, code, includeSpecial }) => ({
        url: '/coursesmulti',
        params: { name, code, includeSpecial },
      }),
    }),
  }),
})

export const { useGetCourseSearchResultQuery } = courseSearchApi
