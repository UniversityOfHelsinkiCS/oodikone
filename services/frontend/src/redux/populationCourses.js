import { RTKApi } from '@/apiConnection'

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

const curriculumsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumOptions: builder.query({
      query: ({ code }) => `/v3/curriculum-options/${code}`,
    }),
    getCurriculums: builder.query({
      query: ({ code, periodIds }) => `/v3/curriculum/${code}/${periodIds.join(',')}`,
    }),
  }),
})

export const { useGetCurriculumOptionsQuery, useGetCurriculumsQuery } = curriculumsApi
