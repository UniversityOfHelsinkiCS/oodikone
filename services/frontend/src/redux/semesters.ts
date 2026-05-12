import { RTKApi } from '@/apiConnection'
import { Name } from '@oodikone/shared/types'

export type Semester = {
  enddate: string
  name: Name
  semestercode: number
  startdate: string
  yearcode: number
}

export type Year = {
  enddate: string
  startdate: string
  yearcode: number
  yearname: string
}

const semestersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSemesters: builder.query<
      {
        semesters: Record<string, Semester>
        years: Record<string, Year>
      },
      void
    >({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
      transformErrorResponse: () => {
        // NOTE: Intentionally crash the page if this request fails.
        //       Semestercodes is an integral part of this project and is needed almost everywhere.
        throw new Error('Semestercodes unavailable.')
      },
    }),
  }),
})

export const { useGetSemestersQuery } = semestersApi
