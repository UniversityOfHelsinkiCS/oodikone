import { RTKApi } from '@/apiConnection'
import { getUnifiedProgrammeName } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetProgrammesQuery } from './populations'

const studyProgrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
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
    updateStudyTrackView: builder.query({
      query: ({ id, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/update_studytrackview?combined_programme=${combinedProgramme}`,
    }),
    getProgrammeCoursesStats: builder.query({
      query: ({ id, academicyear, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/coursestats?academicyear=${academicyear}&combined_programme=${combinedProgramme}`,
    }),
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
  useGetBasicStatsQuery,
  useGetCreditStatsQuery,
  useGetGraduationStatsQuery,
  useGetStudytrackStatsQuery,
  useUpdateBasicViewQuery,
  useUpdateStudyTrackViewQuery,
  useGetProgrammeCoursesStatsQuery,
  useGetEvaluationStatsQuery,
  useGetColorizedTableCourseStatsQuery,
} = studyProgrammeApi

const getFilteredAndFormattedStudyProgrammes = (getTextIn, studyProgrammes) => {
  return studyProgrammes
    .filter(studyProgramme => studyProgramme.code.startsWith('KH') || studyProgramme.code.startsWith('MH'))
    .map(studyProgramme => ({
      key: studyProgramme.code,
      value: studyProgramme.code,
      description: studyProgramme.code,
      text: getTextIn(studyProgramme.name),
    }))
}

const getDataForCombined = studyProgrammes => {
  const combinedProgrammeCodes = ['KH90_001', 'MH90_001']
  return studyProgrammes
    .filter(studyProgramme => combinedProgrammeCodes.includes(studyProgramme.code))
    .reduce((acc, studyProgramme) => ({ ...acc, [studyProgramme.code]: studyProgramme.name }), {})
}

const getCombinedOptions = (dataForCombined, getTextIn, language) => {
  return [
    {
      key: 'KH90_001+MH90_001',
      value: 'KH90_001+MH90_001',
      description: 'KH90_001+MH90_001',
      text: getUnifiedProgrammeName(
        getTextIn(dataForCombined?.KH90_001),
        getTextIn(dataForCombined?.MH90_001),
        language
      ),
    },
  ]
}

/** Returns only newest study programmes and formats them to be used in Semantic UI dropdown menus */
export const useFilteredAndFormattedStudyProgrammes = () => {
  const { data = {} } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(data)
  const { language, getTextIn } = useLanguage()
  const filteredAndFormatted = getFilteredAndFormattedStudyProgrammes(getTextIn, studyProgrammes)
  const dataForCombined = getDataForCombined(studyProgrammes)
  const combinedOptions = getCombinedOptions(dataForCombined, getTextIn, language)
  return [...filteredAndFormatted, ...combinedOptions]
}
