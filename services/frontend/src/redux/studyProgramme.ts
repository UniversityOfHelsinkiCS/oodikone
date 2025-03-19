import { RTKApi } from '@/apiConnection'
import { GetTextIn, useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Language } from '@/shared/language'
import { Graduated, Name, SpecialGroups, StudyProgrammeCourse, StudyTrackStats, YearType } from '@/shared/types'
import { DegreeProgramme } from '@/types/api/faculty'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'
import { useGetProgrammesQuery } from './populations'

const studyProgrammeApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getBasicStats: builder.query<
      any, // TODO: Type
      { id: string; yearType: YearType; specialGroups: SpecialGroups; combinedProgramme: string }
    >({
      query: ({ id, yearType, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/basicstats?year_type=${yearType}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getColorizedTableCourseStats: builder.query<
      any, // TODO: Type
      { id: string }
    >({
      query: ({ id }) => `/v2/studyprogrammes/${id}/colorizedtablecoursestats`,
    }),
    getCreditStats: builder.query<
      any, // TODO: Type
      { codes: string[]; specialGroups: SpecialGroups; yearType: YearType }
    >({
      query: ({ codes, specialGroups, yearType }) =>
        `/v2/studyprogrammes/creditstats?codes=${JSON.stringify(
          codes
        )}&yearType=${yearType}&specialGroups=${specialGroups}`,
    }),
    getGraduationStats: builder.query<
      any, // TODO: Type
      { id: string; yearType: YearType; specialGroups: SpecialGroups; combinedProgramme: string }
    >({
      query: ({ id, yearType, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/graduationstats?year_type=${yearType}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getStudyTrackStats: builder.query<
      StudyTrackStats,
      { id: string; graduated: Graduated; specialGroups: SpecialGroups; combinedProgramme: string }
    >({
      query: ({ id, graduated, specialGroups, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/studytrackstats?graduated=${graduated}&special_groups=${specialGroups}&combined_programme=${combinedProgramme}`,
    }),
    getProgrammeCoursesStats: builder.query<
      StudyProgrammeCourse[],
      { id: string; yearType: YearType; combinedProgramme: string }
    >({
      query: ({ id, yearType, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/coursestats?yearType=${yearType}&combinedProgramme=${combinedProgramme}`,
    }),
    getStudyTracks: builder.query<
      any, // TODO: Type
      { id: string }
    >({
      query: ({ id }) => `/v2/studyprogrammes/${id}/studytracks`,
    }),
    updateBasicView: builder.query<
      any, // TODO: Type
      { id: string; combinedProgramme: string }
    >({
      query: ({ id, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/update_basicview?combined_programme=${combinedProgramme}`,
    }),
    updateStudyTrackView: builder.query<
      any, // TODO: Type
      { id: string; combinedProgramme: string }
    >({
      query: ({ id, combinedProgramme }) =>
        `/v2/studyprogrammes/${id}/update_studytrackview?combined_programme=${combinedProgramme}`,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetBasicStatsQuery,
  useGetColorizedTableCourseStatsQuery,
  useGetCreditStatsQuery,
  useGetGraduationStatsQuery,
  useGetStudyTrackStatsQuery,
  useGetProgrammeCoursesStatsQuery,
  useGetStudyTracksQuery,
  useUpdateBasicViewQuery,
  useUpdateStudyTrackViewQuery,
} = studyProgrammeApi

const getFilteredAndFormattedStudyProgrammes = (getTextIn: GetTextIn, studyProgrammes: DegreeProgramme[]) => {
  return studyProgrammes
    .filter(studyProgramme => studyProgramme.code.startsWith('KH') || studyProgramme.code.startsWith('MH'))
    .map(studyProgramme => ({
      key: studyProgramme.code,
      value: studyProgramme.code,
      description: studyProgramme.code,
      text: getTextIn(studyProgramme.name),
    }))
}

const getDataForCombined = (studyProgrammes: DegreeProgramme[]) => {
  const combinedProgrammeCodes = ['KH90_001', 'MH90_001']
  return studyProgrammes
    .filter(studyProgramme => combinedProgrammeCodes.includes(studyProgramme.code))
    .reduce(
      (acc, studyProgramme) => ({ ...acc, [studyProgramme.code]: studyProgramme.name }),
      {} as Record<string, Name>
    )
}

const getCombinedOptions = (dataForCombined: Record<string, Name>, getTextIn, language: Language) => {
  return [
    {
      key: 'KH90_001+MH90_001',
      value: 'KH90_001+MH90_001',
      description: 'KH90_001+MH90_001',
      text: getCombinedProgrammeName(
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
