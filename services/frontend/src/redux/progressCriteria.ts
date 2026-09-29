import { RTKApi } from '@/apiConnection'
import { ProgressCriteria } from '@oodikone/shared/types/progressCriteria'

const programmeProgressCriteria = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getProgressCriteria: builder.query<ProgressCriteria, { programmeCode: string }>({
      query: ({ programmeCode }) => `/programme-criteria?programmeCode=${programmeCode}`,
      providesTags: ['ProgressCriteria'],
    }),
    addProgressCriteriaCourse: builder.mutation<
      void,
      { courseGroupIds: string[]; programmeCode: string; year: number }
    >({
      query: ({ courseGroupIds, programmeCode, year }) => ({
        url: '/programme-criteria/courses',
        method: 'POST',
        body: {
          code: programmeCode,
          courseGroupIds,
          year,
        },
      }),
      invalidatesTags: ['ProgressCriteria'],
    }),
    addProgressCriteriaCredits: builder.mutation<void, { credits: Record<string, number>; programmeCode: string }>({
      query: ({ credits, programmeCode }) => ({
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
