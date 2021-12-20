import { RTKApi } from 'apiConnection'

const studyprogrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getBasicStats: builder.query({
      query: ({ id, yearType }) => `/v2/studyprogrammes/${id}/basicstats?year_type=${yearType}`,
    }),
    getCreditStats: builder.query({
      query: ({ id, yearType }) => `/v2/studyprogrammes/${id}/creditstats?year_type=${yearType}`,
    }),
    getGraduationStats: builder.query({
      query: ({ id, yearType }) => `/v2/studyprogrammes/${id}/graduationstats?year_type=${yearType}`,
    }),
    getStudytrackStats: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/studytrackstats`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery, useGetStudytrackStatsQuery } =
  studyprogrammeApi
