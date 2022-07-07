import { RTKApi } from 'apiConnection'

const facultystatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getFaculties: builder.query({
      query: () => '/faculties',
    }),
    getBasicStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/faculties/${id}/basicstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
    getCreditStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/faculties/${id}/creditstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
    getGraduationStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/faculties/${id}/graduationstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetFacultiesQuery, useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } =
  facultystatsApi
