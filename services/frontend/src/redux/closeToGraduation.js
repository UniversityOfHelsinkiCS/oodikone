import { RTKApi } from '@/apiConnection'

const closeToGraduationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentsCloseToGraduation: builder.query({
      query: () => 'close-to-graduation',
    }),
  }),
})

export const { useGetStudentsCloseToGraduationQuery } = closeToGraduationApi
