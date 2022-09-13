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
      query: ({ id, yearType, studyProgrammeFilter, specialGroups }) =>
        `/faculties/${id}/thesisstats?year_type=${yearType}&programme_filter=${studyProgrammeFilter}&special_groups=${specialGroups}`,
    }),
    getFacultyGraduationTimes: builder.query({
      query: ({ id, studyProgrammeFilter }) =>
        `/faculties/${id}/graduationtimes?programme_filter=${studyProgrammeFilter}`,
    }),
    updateFacultyBasicView: builder.query({
      query: ({ id, statsType }) => `/faculties/${id}/update_basicview?stats_type=${statsType}`,
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
  useUpdateFacultyBasicViewQuery,
} = facultystatsApi
