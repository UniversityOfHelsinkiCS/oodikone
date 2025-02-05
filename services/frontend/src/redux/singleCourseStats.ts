import { RTKApi } from '@/apiConnection'
import { GetSingleCourseStatsRequest, GetSingleCourseStatsResponse } from '@/types/api/courses'

const singleCourseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSingleCourseStats: builder.query<GetSingleCourseStatsResponse, GetSingleCourseStatsRequest>({
      query: ({ courseCodes, separate, combineSubstitutions }) =>
        `/v3/courseyearlystats?${courseCodes
          .map(code => `codes[]=${code}`)
          .join('&')}&separate=${separate}&combineSubstitutions=${combineSubstitutions}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetSingleCourseStatsQuery } = singleCourseStatsApi
