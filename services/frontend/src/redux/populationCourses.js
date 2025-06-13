import { RTKApi } from '@/apiConnection'

const courseStatisticsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getPopulationCourseStatistics: builder.query({
      query: ({ selectedStudents, selectedStudentsByYear, courses }) => ({
        url: '/v4/populationstatistics/courses',
        method: 'POST',
        body: { selectedStudents, selectedStudentsByYear, courses },
      }),
    }),
  }),
})

export const { useGetPopulationCourseStatisticsQuery } = courseStatisticsApi

// TODO: This was used in the PopulationSearchForm
// export const clearSelected = () => populationCoursesApi.util.resetApiState()
