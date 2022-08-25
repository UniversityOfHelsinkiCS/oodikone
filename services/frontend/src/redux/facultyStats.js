import { RTKApi } from 'apiConnection'

const facultystatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getFaculties: builder.query({
      query: () => '/faculties',
    }),
    getFacultyBasicStats: builder.query({
      query: ({ id, yearType, studyProgrammeFilter, specialGroups }) =>
        `/faculties/${id}/basicstats?year_type=${yearType}&programme_filter=${studyProgrammeFilter}&special_groups=${specialGroups}`,
    }),
    getFacultyCreditStats: builder.query({
      query: ({ id, yearType, studyProgrammeFilter, specialGroups }) =>
        `/faculties/${id}/creditstats?year_type=${yearType}&programme_filter=${studyProgrammeFilter}&special_groups=${specialGroups}`,
    }),
    getFacultyThesisStats: builder.query({
      query: ({ id, yearType, studyProgrammeFilter }) =>
        `/faculties/${id}/thesisstats?year_type=${yearType}&programme_filter=${studyProgrammeFilter}`,
    }),
    getFacultyGraduationTimes: builder.query({
      query: ({ id, mode, excludeOld }) => `/faculties/${id}/graduationtimes?mode=${mode}&excludeOld=${excludeOld}`,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetFacultiesQuery,
  useGetFacultyBasicStatsQuery,
  useGetFacultyCreditStatsQuery,
  useGetFacultyThesisStatsQuery,
  useGetFacultyGraduationTimesQuery,
} = facultystatsApi
