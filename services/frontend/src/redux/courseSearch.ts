import { RTKApi } from '@/apiConnection'
import { GetCourseSearchResultRequest, GetCourseSearchResultResponse } from '@/types/api/courses'

const courseSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseSearchResult: builder.query<GetCourseSearchResultResponse, GetCourseSearchResultRequest>({
      query: ({ name, code, includeCustom }) => ({
        url: '/coursesmulti',
        params: { name, code, includeCustom },
      }),
    }),
  }),
})

export const { useGetCourseSearchResultQuery } = courseSearchApi
