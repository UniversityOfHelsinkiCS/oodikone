import { RTKApi } from '@/apiConnection'
import { CurriculumOption, CurriculumDetails } from '@oodikone/shared/types'

const curriculumsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumOptions: builder.query<CurriculumOption[], { code: string }>({
      query: ({ code }) => `/curriculum-options/${code}`,
    }),
    getCurriculums: builder.query<CurriculumDetails, { code: string; periodIds: string[] }>({
      query: ({ code, periodIds }) => `/curriculum/${code}/${periodIds.join(',')}`,
    }),
  }),
})

export const { useGetCurriculumOptionsQuery, useGetCurriculumsQuery } = curriculumsApi
