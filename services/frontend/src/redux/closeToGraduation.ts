import { RTKApi } from '@/apiConnection'
import type { CloseToGraduationResBody } from '@oodikone/shared/routes/closeToGraduation'

const closeToGraduationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentsCloseToGraduation: builder.query<CloseToGraduationResBody, void>({
      query: () => 'close-to-graduation',
    }),
  }),
})

export const { useGetStudentsCloseToGraduationQuery } = closeToGraduationApi
