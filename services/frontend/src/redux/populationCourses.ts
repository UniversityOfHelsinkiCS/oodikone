import { RTKApi } from '@/apiConnection'
import type { CanError } from '@oodikone/shared/routes'
import type {
  PopulationstatisticsCoursesReqBody,
  PopulationstatisticsCoursesResBody,
} from '@oodikone/shared/routes/populations'

const courseStatisticsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getPopulationCourseStatistics: builder.query<
      PopulationstatisticsCoursesResBody,
      PopulationstatisticsCoursesReqBody
    >({
      query: ({ selectedStudents, selectedStudentsByYear }) => ({
        url: '/v4/populationstatistics/courses',
        method: 'POST',
        body: { selectedStudents, selectedStudentsByYear },
      }),
      transformResponse: (res: CanError<PopulationstatisticsCoursesResBody>) => {
        if ('error' in res) throw new Error(res.error)
        return res
      },
    }),
  }),
})

export const { useGetPopulationCourseStatisticsQuery } = courseStatisticsApi

// TODO: This was used in the PopulationSearchForm
// export const clearSelected = () => populationCoursesApi.util.resetApiState()
