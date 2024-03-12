import { RTKApi } from '@/apiConnection'

const programmeProgressCriteria = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getProgressCriteria: builder.query({
      query: ({ programmeCode }) => `/programmecriteria?programmecode=${programmeCode}`,
    }),
    addProgressCriteriaCourse: builder.mutation({
      query: ({ programmeCode, courses, year }) => ({
        url: '/programmecriteria/courses',
        method: 'POST',
        body: {
          code: programmeCode,
          courses,
          year,
        },
      }),
    }),
    addProgressCriteriaCredits: builder.mutation({
      query: ({ programmeCode, credits }) => ({
        url: '/programmecriteria/credits',
        method: 'POST',
        body: {
          code: programmeCode,
          credits,
        },
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProgressCriteriaQuery,
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
} = programmeProgressCriteria
