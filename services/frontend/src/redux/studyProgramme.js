import { RTKApi } from '@/apiConnection'
import { getUnifiedProgrammeName } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'

const studyProgrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudyProgrammes: builder.query({
      query: () => '/v2/studyprogrammes',
    }),
    getBasicStats: builder.query({
      query: ({ id, yearType, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/basicstats?year_type=${yearType}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getCreditStats: builder.query({
      query: ({ codes, isAcademicYear, specialGroups }) =>
        `/v2/studyprogrammes/creditstats?codes=${JSON.stringify(
          codes
        )}&isAcademicYear=${isAcademicYear}&includeSpecials=${specialGroups}`,
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
      query: ({ id, academicyear, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/coursestats?academicyear=${academicyear}&combined_programme=${combinedProgramme}`,
    }),
    // Tilannekuvalomake
    getEvaluationStats: builder.query({
      query: ({ id, yearType, specialGroups, graduated }) =>
        `/v2/studyprogrammes/${id}/evaluationstats?year_type=${yearType}&special_groups=${specialGroups}&graduated=${graduated}`,
    }),
    getColorizedTableCourseStats: builder.query({
      query: ({ id }) => `/v2/studyprogrammes/${id}/colorizedtablecoursestats`,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetStudyProgrammesQuery,
  useGetBasicStatsQuery,
  useGetCreditStatsQuery,
  useGetGraduationStatsQuery,
  useGetStudytrackStatsQuery,
  useUpdateBasicViewQuery,
  useUpdateStudytrackViewQuery,
  useGetProgrammeCoursesStatsQuery,
  useGetEvaluationStatsQuery,
  useGetColorizedTableCourseStatsQuery,
} = studyProgrammeApi

/*
 * Returns only newest study programmes and formats them to be used in Semantic UI dropdown menus
 */
export const useFilteredAndFormattedStudyProgrammes = () => {
  const { data: studyProgrammes, isLoading } = useGetStudyProgrammesQuery()
  const { language, getTextIn } = useLanguage()
  const filteredAndFormatted = isLoading
    ? []
    : studyProgrammes
        .filter(studyProgramme => studyProgramme.code.startsWith('KH') || studyProgramme.code.startsWith('MH'))
        .map(studyProgramme => ({
          key: studyProgramme.code,
          value: studyProgramme.code,
          description: studyProgramme.code,
          text: getTextIn(studyProgramme.name),
        }))
  const combinedProgrammeCodes = ['KH90_001', 'MH90_001']
  const dataForCombined = isLoading
    ? {}
    : studyProgrammes
        .filter(studyProgramme => combinedProgrammeCodes.includes(studyProgramme.code))
        .reduce((acc, studyProgramme) => ({ ...acc, [studyProgramme.code]: studyProgramme.name }), {})

  const combinedOptions =
    isLoading && !dataForCombined
      ? []
      : [
          {
            key: 'KH90_001+MH90_001',
            value: 'KH90_001+MH90_001',
            description: 'KH90_001+MH90_001',
            text: getUnifiedProgrammeName(
              getTextIn(dataForCombined.KH90_001),
              getTextIn(dataForCombined.MH90_001),
              language
            ),
          },
        ]

  return [...filteredAndFormatted, ...combinedOptions]
}
