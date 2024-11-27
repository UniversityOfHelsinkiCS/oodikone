import { RTKApi } from '@/apiConnection'

type CloseToGraduationData = {
  bachelor: any[]
  lastUpdated: string
  masterAndLicentiate: any[]
}

const closeToGraduationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudentsCloseToGraduation: builder.query<CloseToGraduationData, void>({
      query: () => 'close-to-graduation',
    }),
  }),
})

export const { useGetStudentsCloseToGraduationQuery } = closeToGraduationApi
