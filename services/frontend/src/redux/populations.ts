import { RTKApi } from '@/apiConnection'
import type { PopulationQuery } from '@/types/populationSearch'
import type {
  PopulationstatisticsResBody,
  PopulationstatisticsbycourseResBody,
  PopulationstatisticsbycourseParams,
  PopulationstatisticsMaxYearsToCreatePopulationFormResBody,
  PopulationstatisticsMaxYearsToCreatePopulationFormQuery,
  PopulationstatisticsStudyprogrammesResBody,
  CustomPopulationQuery,
  GetCustomPopulationResBody,
} from '@oodikone/shared/routes/populations'

const populationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getPopulationStatistics: builder.query<PopulationstatisticsResBody, PopulationQuery>({
      query: params => ({
        url: '/v3/populationstatistics/',
        method: 'GET',
        params,
      }),
    }),
    getCustomPopulation: builder.query<GetCustomPopulationResBody, CustomPopulationQuery>({
      query: ({ studentNumbers, tags }) => ({
        url: '/v3/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: {
          studentNumbers,
          tags,
        },
      }),
    }),
    getPopulationStatisticsByCourse: builder.query<
      PopulationstatisticsbycourseResBody,
      PopulationstatisticsbycourseParams
    >({
      query: ({ coursecodes, from, to, separate, unifyCourses }) => ({
        url: '/v3/populationstatisticsbycourse',
        params: { coursecodes, from, to, separate, unifyCourses },
      }),
    }),
    getMaxYearsToCreatePopulationFrom: builder.query<
      PopulationstatisticsMaxYearsToCreatePopulationFormResBody,
      PopulationstatisticsMaxYearsToCreatePopulationFormQuery
    >({
      query: ({ courseCodes }) => ({
        url: '/v3/populationstatistics/maxYearsToCreatePopulationFrom',
        params: { courseCodes },
      }),
    }),
    getProgrammes: builder.query<PopulationstatisticsStudyprogrammesResBody, void>({
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

// TODO: This was used in the PopulationSearchForm
// export const clearPopulations = () => populationApi.util.resetApiState()
