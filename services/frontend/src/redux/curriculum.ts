import { RTKApi } from '@/apiConnection'
import { CurriculumOption, CurriculumDetails } from '@/shared/types'

const curriculumsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumOptions: builder.query<CurriculumOption[], { code: string }>({
      query: ({ code }) => `/v3/curriculum-options/${code}`,
    }),
    getCurriculums: builder.query<CurriculumDetails, { code: string; periodIds: string[] }>({
      query: ({ code, periodIds }) => `/v3/curriculum/${code}/${periodIds.join(',')}`,
    }),
  }),
})

export const { useGetCurriculumOptionsQuery, useGetCurriculumsQuery } = curriculumsApi
