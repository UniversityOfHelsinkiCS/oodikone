import { RTKApi } from '@/apiConnection'
import { ProgressCriteria } from '@/shared/types/progressCriteria'

const programmeProgressCriteria = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getProgressCriteria: builder.query<ProgressCriteria, { programmeCode: string }>({
      query: ({ programmeCode }) => `/programme-criteria?programmeCode=${programmeCode}`,
      providesTags: ['ProgressCriteria'],
    }),
    addProgressCriteriaCourse: builder.mutation({
      query: ({ programmeCode, courses, year }) => ({
        url: '/programme-criteria/courses',
        method: 'POST',
        body: {
          code: programmeCode,
          courses,
          year,
        },
      }),
      invalidatesTags: ['ProgressCriteria'],
    }),
    addProgressCriteriaCredits: builder.mutation<
      ProgressCriteria,
      { programmeCode: string; credits: Record<string, number> }
    >({
      query: ({ programmeCode, credits }) => ({
        url: '/programme-criteria/credits',
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
