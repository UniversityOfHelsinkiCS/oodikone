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
  CustomPopulationByStudentNumbersQuery,
  CustomPopulationByStudentNumbersResBody,
  CustomPopulationByProgrammesQuery,
  CustomPopulationByProgrammesResBody,
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
    getCustomPopulationByStudentNumbers: builder.query<
      Output<CustomPopulationByStudentNumbersResBody>,
      CustomPopulationByStudentNumbersQuery
    >({
      query: ({ studentNumbers, tags }) => ({
        url: '/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: { studentNumbers, tags },
      }),
      transformResponse: formatPopulationData<CustomPopulationByStudentNumbersResBody>,
    }),
    getCustomPopulationByProgrammes: builder.query<
      Output<CustomPopulationByProgrammesResBody>,
      CustomPopulationByProgrammesQuery
    >({
      query: ({ programmes, years }) => ({
        url: '/populationstatisticsbyprogrammecodes',
        method: 'POST',
        body: { programmes, years },
      }),
      transformResponse: formatPopulationData<CustomPopulationByProgrammesResBody>,
    }),
    getPopulationStatisticsByCourse: builder.query<
      Output<PopulationstatisticsbycourseResBody>,
      PopulationstatisticsbycourseParams
    >({
      query: ({ courses, from, to, separate, unifyCourses, substitutions }) => ({
        url: '/populationstatisticsbycourse',
        params: { courses, from, to, separate, unifyCourses, substitutions },
      }),
      transformResponse: formatPopulationData<PopulationstatisticsbycourseResBody>,
    }),
    getProgrammes: builder.query<PopulationstatisticsStudyprogrammesResBody, void>({
      query: () => '/populationstatistics/studyprogrammes',
      // keepUnusedDataFor: 60 * 60,
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetPopulationStatisticsQuery,
  useGetCustomPopulationByStudentNumbersQuery,
  useGetCustomPopulationByProgrammesQuery,
  useGetPopulationStatisticsByCourseQuery,
  useGetProgrammesQuery,
} = populationApi
