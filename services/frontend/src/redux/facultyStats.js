import { RTKApi } from 'apiConnection'

const facultystatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getFaculties: builder.query({
      query: () => '/faculties',
    }),
    getFacultyBasicStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/faculties/${id}/basicstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
    getFacultyCreditStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/faculties/${id}/creditstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetFacultiesQuery, useGetFacultyBasicStatsQuery, useGetFacultyCreditStatsQuery } = facultystatsApi
