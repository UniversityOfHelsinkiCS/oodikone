import { RTKApi } from '@/apiConnection'

const tagsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    // Combined programme is included to studytrack in form KHxx_xxx-MHxx_xxx
    getTagsByStudyTrack: builder.query({
      query: studyTrack => `/tags/${studyTrack}`,
      providesTags: ['Tags'],
    }),
    // Tag object includes all the information. Possible combined programme is included in the tag.
    createTag: builder.mutation({
      query: tag => ({ url: '/tags', method: 'POST', body: { tag } }),
      invalidatesTags: ['Tags'],
    }),
    deleteTag: builder.mutation({
      query: tag => ({ url: '/tags', method: 'DELETE', body: { tag } }),
      invalidatesTags: ['Tags'],
    }),
    getStudentTagsByStudyTrack: builder.query({
      query: studytrack => `/studenttags/${studytrack}`,
    }),
    createStudentTags: builder.mutation({
      query: ({ tags, studytrack, combinedProgramme }) => ({
        url: '/studenttags',
        method: 'POST',
        body: { tags, studytrack, combinedProgramme },
      }),
    }),
    deleteStudentTags: builder.mutation({
      query: ({ tagId, studentnumbers, studytrack, combinedProgramme }) => ({
        url: '/studenttags',
        method: 'DELETE',
        body: { tagId, studentnumbers, studytrack, combinedProgramme },
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTagsByStudyTrackQuery,
  useCreateTagMutation,
  useDeleteTagMutation,
  useGetStudentTagsByStudyTrackQuery,
  useCreateStudentTagsMutation,
  useDeleteStudentTagsMutation,
} = tagsApi
