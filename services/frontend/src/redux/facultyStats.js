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
      query: ({ id, studyProgrammeFilter }) =>
        `/faculties/${id}/graduationtimes?programme_filter=${studyProgrammeFilter}`,
    }),
    updateFacultyBasicView: builder.query({
      query: ({ id }) => `/faculties/${id}/update_basicview`,
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
