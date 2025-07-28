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
        currentSemester: SemestersData['semesters'][string]
      },
      void
    >({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
      transformResponse: (semesterData: SemestersData) => {
        const currentSemester =
          Object.values(semesterData.semesters).find(
            semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
          ) ?? null

        // HACK: currentSemester should never be null
        if (currentSemester === null) throw Error("No current semester found")

        return { ...semesterData, currentSemester }
      },
    }),
  }),
})

export const { useGetSemestersQuery } = semestersApi
