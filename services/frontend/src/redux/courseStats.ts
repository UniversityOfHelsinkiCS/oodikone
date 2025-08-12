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
        url: '/v3/courseyearlystats',
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
  }),
})

export const { useGetCourseStatsQuery } = courseStatsApi
// export const clearCourseStats = () => courseStatsApi.util.resetApiState()
