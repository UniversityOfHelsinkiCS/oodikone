import { RTKApi } from '@/apiConnection'
import { Name } from '@oodikone/shared/types'

type Semester = {
  enddate: string
  name: Name
  semestercode: number
  startdate: string
  yearcode: number
}

type Year = {
  enddate: string
  startdate: string
  yearcode: number
  yearname: string
}

export type SemestersData = {
  currentSemester: Semester
  semesters: Record<string, Semester>
  years: Record<string, Year>
}

const semestersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSemesters: builder.query<SemestersData, void>({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
      transformResponse: (semesterData: SemestersData) => {
        const currentSemester =
          Object.values(semesterData.semesters).find(
            semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
          ) ?? null

        // HACK: currentSemester should never be null
        if (currentSemester === null) throw Error('No current semester found')

        return { ...semesterData, currentSemester }
      },
      transformErrorResponse: () => {
        // NOTE: Intentionally crash the page if this request fails.
        //       Semestercodes is an integral part of this project and is needed almost everywhere.
        throw new Error('Semestercodes unavailable.')
      },
    }),
  }),
})

export const { useGetSemestersQuery } = semestersApi
