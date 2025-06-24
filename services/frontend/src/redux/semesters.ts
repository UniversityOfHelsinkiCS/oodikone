import { RTKApi } from '@/apiConnection'
import { Name } from '@oodikone/shared/types'

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
    getSemesters: builder.query<
      SemestersData & {
        currentSemester: SemestersData['semesters'][string] | null
      },
      void
    >({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
      transformResponse: (
        semesterData: SemestersData
      ): SemestersData & {
        currentSemester: SemestersData['semesters'][string] | null
      } => {
        const currentSemester =
          Object.values(semesterData.semesters).find(
            semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
          ) ?? null

        return { ...semesterData, currentSemester }
      },
    }),
  }),
})

export const { useGetSemestersQuery } = semestersApi
