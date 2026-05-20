import { RTKApi } from '@/apiConnection'
import { CourseStat } from '@/types/courseStat'

const courseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseStats: builder.query({
      query: ({
        codes,
        separate,
        combineSubstitutions,
      }: {
        codes: string[]
        separate?: boolean
        combineSubstitutions?: boolean
      }) => ({
        url: '/courseyearlystats',
        params: { codes, separate, combineSubstitutions },
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
      query: ({ code }: { code: string }) => ({
        url: '/coursedetails',
        params: { code },
      }),
    }),
  }),
})

export const { useGetCourseStatsQuery, useGetCourseDetailsQuery } = courseStatsApi
// export const clearCourseStats = () => courseStatsApi.util.resetApiState()
