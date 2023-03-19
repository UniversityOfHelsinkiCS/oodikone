import { RTKApi } from 'apiConnection'

const studyprogrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getBasicStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/v2/studyprogrammes/${id}/basicstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
    getCreditStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/v2/studyprogrammes/${id}/creditstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
    getGraduationStats: builder.query({
      query: ({ id, yearType, specialGroups }) =>
        `/v2/studyprogrammes/${id}/graduationstats?year_type=${yearType}&special_groups=${specialGroups}`,
    }),
    getStudytrackStats: builder.query({
      query: ({ id, graduated, specialGroups }) =>
        `/v2/studyprogrammes/${id}/studytrackstats?graduated=${graduated}&special_groups=${specialGroups}`,
    }),
    updateBasicView: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/update_basicview`,
    }),
    updateStudytrackView: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/update_studytrackview`,
    }),
    getProgrammeCoursesStats: builder.query({
      query: ({ id, academicyear }) => `/v2/studyprogrammes/${id}/coursestats?academicyear=${academicyear}`,
    }),
    getEvaluationStats: builder.query({
      query: ({ id, yearType, specialGroups, graduated }) =>
        `/v2/studyprogrammes/${id}/evaluationstats?year_type=${yearType}&special_groups=${specialGroups}&graduated=${graduated}`,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetBasicStatsQuery,
  useGetCreditStatsQuery,
  useGetGraduationStatsQuery,
  useGetStudytrackStatsQuery,
  useUpdateBasicViewQuery,
  useUpdateStudytrackViewQuery,
  useGetProgrammeCoursesStatsQuery,
  useGetEvaluationStatsQuery,
} = studyprogrammeApi
