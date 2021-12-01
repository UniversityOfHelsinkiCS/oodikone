import { RTKApi } from 'apiConnection'

const studyprogrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getBasicStats: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/basicstats`,
    }),
    getCreditStats: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/creditstats`,
    }),
    getGraduationStats: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/graduationstats`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } = studyprogrammeApi
