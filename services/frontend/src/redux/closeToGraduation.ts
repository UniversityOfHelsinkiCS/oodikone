import { RTKApi } from '@/apiConnection'
import { CloseToGraduationData } from '@oodikone/shared/routes/populations'

type CloseToGraduationResponse = {
  bachelor: CloseToGraduationData[]
  lastUpdated: string
  masterAndLicentiate: CloseToGraduationData[]
}

const closeToGraduationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentsCloseToGraduation: builder.query<CloseToGraduationResponse, void>({
      query: () => 'close-to-graduation',
    }),
  }),
})

export const { useGetStudentsCloseToGraduationQuery } = closeToGraduationApi
