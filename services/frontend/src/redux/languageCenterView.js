import { RTKApi } from '@/apiConnection'

const languageCenterApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getLanguageCenterData: builder.query({
      query: () => 'languagecenterdata',
    }),
  }),
})

export const { useGetLanguageCenterDataQuery } = languageCenterApi
