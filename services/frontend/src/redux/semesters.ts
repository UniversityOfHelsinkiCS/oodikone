import { RTKApi } from '@/apiConnection'
import { Name } from '@/shared/types'

export type SemestersData = {
  semesters: Record<
    string,
    {
      enddate: string
      name: Name
      semestercode: number
      startdate: string
      yearcode: number
    }
  >
  years: Record<
    string,
    {
      enddate: string
      startdate: string
      yearcode: number
      yearname: string
    }
  >
}

const semestersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSemesters: builder.query<SemestersData, void>({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
    }),
  }),
})

export const { useGetSemestersQuery } = semestersApi
