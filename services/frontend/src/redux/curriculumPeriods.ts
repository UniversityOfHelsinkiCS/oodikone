import { RTKApi } from '@/apiConnection'
import { CurriculumPeriod } from '@oodikone/shared/types'

const curriculumPeriodsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumPeriods: builder.query<CurriculumPeriod[], void>({
      query: () => '/curriculum-periods',
    }),
  }),
  overrideExisting: false,
})

export const { useGetCurriculumPeriodsQuery } = curriculumPeriodsApi
