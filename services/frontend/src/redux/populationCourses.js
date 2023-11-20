import { RTKApi } from '../apiConnection'

const courseStatisticsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentListCourseStatistics: builder.query({
      query: ({ studentNumbers }) => ({
        url: '/v2/populationstatistics/coursesbystudentnumberlist',
        method: 'POST',
        body: {
          studentnumberlist: studentNumbers,
        },
      }),
    }),
  }),
})

export const { useGetStudentListCourseStatisticsQuery } = courseStatisticsApi

export const curriculumsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumOptions: builder.query({
      query: ({ code }) => `/v3/get_curriculum_options/${code}`,
    }),
    getCurriculums: builder.query({
      // eslint-disable-next-line camelcase
      query: ({ code, period_ids }) => `/v3/get_curriculum/${code}/${period_ids.join(',')}`,
    }),
  }),
})
