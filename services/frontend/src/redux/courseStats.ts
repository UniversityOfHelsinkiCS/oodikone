import { RTKApi } from '@/apiConnection'
import { CourseStat } from '@/types/courseStat'

const courseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseStats: builder.query({
      query: ({
        codes,
        separate,
        combineSubstitutions,
        fromYearCode,
        toYearCode,
      }: {
        codes: string[]
        separate?: boolean
        combineSubstitutions?: boolean
        fromYearCode: string
        toYearCode: string
      }) => ({
        url: '/courseyearlystats',
        params: { codes, separate, combineSubstitutions, fromYearCode, toYearCode },
      }),
      transformResponse: (
        courseStats: { openStats: CourseStat; regularStats: CourseStat; unifyStats: CourseStat }[]
      ) => {
        const data: Record<string, { openStats: CourseStat; regularStats: CourseStat; unifyStats: CourseStat }> = {}
        courseStats.forEach(stat => {
          data[stat.unifyStats.coursecode] = stat
        })

        return data
      },
    }),
    getCourseDetails: builder.query({
      query: ({ codes }: { codes: string | string[] }) => ({
        url: '/coursedetails',
        params: { codes },
      }),
    }),
  }),
})

export const { useGetCourseStatsQuery, useGetCourseDetailsQuery } = courseStatsApi
// export const clearCourseStats = () => courseStatsApi.util.resetApiState()
