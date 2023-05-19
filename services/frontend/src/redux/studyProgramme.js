import { RTKApi } from 'apiConnection'

const studyprogrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getBasicStats: builder.query({
      query: ({ id, yearType, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/basicstats?year_type=${yearType}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getCreditStats: builder.query({
      query: ({ id, yearType, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/creditstats?year_type=${yearType}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getGraduationStats: builder.query({
      query: ({ id, yearType, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/graduationstats?year_type=${yearType}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getStudytrackStats: builder.query({
      query: ({ id, graduated, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/studytrackstats?graduated=${graduated}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    updateBasicView: builder.query({
      query: ({ id, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/update_basicview?combined_programme=${combinedProgramme}`,
    }),
    updateStudytrackView: builder.query({
      query: ({ id, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/update_studytrackview?combined_programme=${combinedProgramme}`,
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
