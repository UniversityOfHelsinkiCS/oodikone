import { RTKApi } from '@/apiConnection'
import { formatPopulationData, type Output } from '@/redux/populations/util'
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
    getPopulationStatistics: builder.query<Output<PopulationstatisticsResBody>, PopulationQuery>({
      query: params => ({
        url: '/populationstatistics/',
        method: 'GET',
        params,
      }),
      transformResponse: formatPopulationData<PopulationstatisticsResBody>,
    }),
    getCustomPopulation: builder.query<Output<GetCustomPopulationResBody>, CustomPopulationQuery>({
      query: ({ studentNumbers, tags }) => ({
        url: '/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: {
          studentNumbers,
          tags,
        },
      }),
      transformResponse: formatPopulationData<GetCustomPopulationResBody>,
    }),
    getPopulationStatisticsByCourse: builder.query<
      Output<PopulationstatisticsbycourseResBody>,
      PopulationstatisticsbycourseParams
    >({
      query: ({ coursecodes, from, to, separate, unifyCourses, includeSubstitutions }) => ({
        url: '/populationstatisticsbycourse',
        params: { coursecodes, from, to, separate, unifyCourses, includeSubstitutions },
      }),
      transformResponse: formatPopulationData<PopulationstatisticsbycourseResBody>,
    }),
    getMaxYearsToCreatePopulationFrom: builder.query<
      PopulationstatisticsMaxYearsToCreatePopulationFormResBody,
      PopulationstatisticsMaxYearsToCreatePopulationFormQuery
    >({
      query: ({ courseCodes }) => ({
        url: '/populationstatistics/maxYearsToCreatePopulationFrom',
        params: { courseCodes },
      }),
    }),
    getProgrammes: builder.query<PopulationstatisticsStudyprogrammesResBody, void>({
      query: () => '/populationstatistics/studyprogrammes',
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
