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
    getFacultyProgressStats: builder.query({
      query: ({ id, specialGroups, graduated }) =>
        `/faculties/${id}/progressstats?special_groups=${specialGroups}&graduated=${graduated}`,
    }),
    getAllFacultiesProgressStats: builder.query({
      query: ({ graduated }) => `/faculties/allprogressstats?graduated=${graduated}`,
    }),
    getFacultyStudentStats: builder.query({
      query: ({ id, specialGroups, graduated }) =>
        `/faculties/${id}/studentstats?special_groups=${specialGroups}&graduated=${graduated}`,
    }),
    updateFacultyBasicView: builder.query({
      query: ({ id, statsType }) => `/faculties/${id}/update_basicview?stats_type=${statsType}`,
    }),
    updateFacultyProgressView: builder.query({
      query: ({ id }) => `/faculties/${id}/update_progressview`,
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
  useGetFacultyProgressStatsQuery,
  useGetAllFacultiesProgressStatsQuery,
  useGetFacultyStudentStatsQuery,
  useUpdateFacultyBasicViewQuery,
  useUpdateFacultyProgressViewQuery,
} = facultystatsApi
