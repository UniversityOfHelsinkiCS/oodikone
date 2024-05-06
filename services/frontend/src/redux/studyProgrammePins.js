import { RTKApi } from '@/apiConnection'

const studyProgrammePinsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getStudyProgrammePins: builder.query({
      query: () => 'study-programme-pins',
      providesTags: ['StudyProgrammePins'],
    }),
    addStudyProgrammePin: builder.mutation({
      query: ({ programmeCode }) => ({
        url: 'study-programme-pins',
        method: 'POST',
        body: {
          programmeCode,
        },
      }),
      invalidatesTags: ['StudyProgrammePins'],
    }),
    removeStudyProgrammePin: builder.mutation({
      query: ({ programmeCode }) => ({
        url: 'study-programme-pins',
        method: 'DELETE',
        body: {
          programmeCode,
        },
      }),
      invalidatesTags: ['StudyProgrammePins'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetStudyProgrammePinsQuery, useAddStudyProgrammePinMutation, useRemoveStudyProgrammePinMutation } =
  studyProgrammePinsApi
