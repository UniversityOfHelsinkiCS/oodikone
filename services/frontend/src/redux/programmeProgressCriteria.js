import { RTKApi } from '@/apiConnection'

const programmeProgressCriteria = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getProgressCriteria: builder.query({
      query: ({ programmeCode }) => `/programmecriteria?programmecode=${programmeCode}`,
      providesTags: ['ProgressCriteria'],
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
      invalidatesTags: ['ProgressCriteria'],
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
      invalidatesTags: ['ProgressCriteria'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetProgressCriteriaQuery,
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
} = programmeProgressCriteria
