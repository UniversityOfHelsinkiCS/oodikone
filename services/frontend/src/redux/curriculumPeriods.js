import { RTKApi } from '@/apiConnection'

const curriculumPeriodsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumPeriods: builder.query({
      query: () => '/curriculum-periods',
    }),
  }),
  overrideExisting: false,
})

export const { useGetCurriculumPeriodsQuery } = curriculumPeriodsApi
