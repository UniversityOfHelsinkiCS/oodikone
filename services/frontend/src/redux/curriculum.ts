import { RTKApi } from '@/apiConnection'

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
