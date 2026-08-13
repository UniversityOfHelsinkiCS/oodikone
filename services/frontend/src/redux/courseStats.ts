import { RTKApi } from '@/apiConnection'
import { CourseYearlyStats } from '@oodikone/shared/types/courseYearlyStats'

const courseStatsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCourseStats: builder.query({
      query: ({
        courses,
        separate,
        substitutions,
        fromYearCode,
        toYearCode,
      }: {
        courses: string[]
        separate?: boolean
        substitutions?: boolean
        fromYearCode: string
        toYearCode: string
      }) => ({
        url: '/courseyearlystats',
        params: { courses, separate, substitutions, fromYearCode, toYearCode },
      }),
      transformResponse: (courseStats: CourseYearlyStats[]) => {
        const data: Record<string, CourseYearlyStats> = {}
        courseStats.forEach(stat => {
          if (stat.unifyStats) {
            data[stat.unifyStats.groupId] = stat
          }
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
