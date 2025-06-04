import { RTKApi } from '@/apiConnection'
import { DegreeProgramme } from '@/types/api/faculty'

const populationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getPopulationStatistics: builder.query({
      query: ({ semesters, studentStatuses, studyRights, months, year, years }) => {
        const params = new URLSearchParams({
          studyRights: JSON.stringify(studyRights),
          year,
          months,
        })

        if (semesters && !Array.isArray(semesters)) params.append('semesters[]', semesters)
        else if (semesters) semesters.forEach(s => params.append('semesters[]', s))

        if (years && !Array.isArray(years)) params.append('years[]', years)
        else if (years) years.forEach(y => params.append('years[]', y))

        if (studentStatuses && !Array.isArray(studentStatuses)) params.append('studentStatuses[]', studentStatuses)
        else if (studentStatuses) studentStatuses.forEach(s => params.append('studentStatuses[]', s))

        return {
          url: '/v3/populationstatistics/',
          method: 'GET',
          params,
        }
      },
    }),
    getCustomPopulation: builder.query({
      query: ({ studentNumbers, tags }) => ({
        url: '/v3/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: {
          studentnumberlist: studentNumbers,
          tags,
        },
      }),
    }),
    getPopulationStatisticsByCourse: builder.query({
      query: ({ coursecodes, from, to, separate, unifyCourses }) => ({
        url: '/v3/populationstatisticsbycourse',
        params: { coursecodes, from, to, separate, unifyCourses },
      }),
    }),
    getMaxYearsToCreatePopulationFrom: builder.query({
      query: ({ courseCodes }) => ({
        url: '/v3/populationstatistics/maxYearsToCreatePopulationFrom',
        params: { courseCodes },
      }),
    }),
    getProgrammes: builder.query<Record<string, DegreeProgramme>, void>({
      query: () => '/v3/populationstatistics/studyprogrammes',
      keepUnusedDataFor: 60 * 60,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPopulationStatisticsQuery,
  useGetCustomPopulationQuery,
  useGetPopulationStatisticsByCourseQuery,
  useGetMaxYearsToCreatePopulationFromQuery,
  useGetProgrammesQuery,
} = populationApi

// export const clearPopulations = () => populationApi.util.resetApiState()
