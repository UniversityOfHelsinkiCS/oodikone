import { RTKApi } from '@/apiConnection'

const courseStatisticsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentListCourseStatistics: builder.query({
      query: ({ studentNumbers }) => ({
        url: '/v4/populationstatistics/courses',
        method: 'POST',
        body: { selectedStudents: studentNumbers },
      }),
    }),
  }),
})

export const { useGetStudentListCourseStatisticsQuery } = courseStatisticsApi
