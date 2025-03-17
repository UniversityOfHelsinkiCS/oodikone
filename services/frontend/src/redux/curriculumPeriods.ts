import { RTKApi } from '@/apiConnection'
import { CurriculumPeriod } from '@/shared/types'

const curriculumPeriodsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumPeriods: builder.query<CurriculumPeriod[], void>({
      query: () => '/curriculum-periods',
    }),
  }),
  overrideExisting: false,
})

export const { useGetCurriculumPeriodsQuery } = curriculumPeriodsApi
