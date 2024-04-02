import { RTKApi } from '@/apiConnection'

const providersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getProviders: builder.query({
      query: () => '/providers',
    }),
  }),
  overrideExisting: false,
})

export const { useGetProvidersQuery } = providersApi
