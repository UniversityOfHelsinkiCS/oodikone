import { RTKApi } from '@/apiConnection'
import { Name } from '@/shared/types'

type CurriculumPeriod = {
  createdAt: string
  endDate: string
  id: string
  name: Name
  startDate: string
  universityOrgId: string
  updatedAt: string
}

const curriculumPeriodsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCurriculumPeriods: builder.query<CurriculumPeriod[], void>({
      query: () => '/curriculum-periods',
    }),
  }),
  overrideExisting: false,
})

export const { useGetCurriculumPeriodsQuery } = curriculumPeriodsApi
