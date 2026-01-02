import { RTKApi } from '@/apiConnection'
import { GetSingleCourseStatsRequest, GetSingleCourseStatsResponse } from '@/types/api/courses'

const singleCourseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSingleCourseStats: builder.query<GetSingleCourseStatsResponse, GetSingleCourseStatsRequest>({
      query: ({ courseCodes, separate, combineSubstitutions }) => ({
        url: '/v3/courseyearlystats',
        params: { codes: courseCodes, separate, combineSubstitutions },
      }),
    }),
  }),
  overrideExisting: false,
})

export const { useGetSingleCourseStatsQuery } = singleCourseStatsApi
