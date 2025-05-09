import { RTKApi } from '@/apiConnection'

import { NewTag, StudentTag, Tag } from '@oodikone/shared/types'

const tagsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    // Combined programme is included to study track in form KHxx_xxx-MHxx_xxx
    getTagsByStudyTrack: builder.query<Tag[], string>({
      query: studyTrack => `/tags/${studyTrack}`,
      providesTags: ['Tags'],
    }),
    // Tag object includes all the information. Possible combined programme is included in the tag.
    createTag: builder.mutation<void, NewTag>({
      query: tag => ({ url: '/tags', method: 'POST', body: { tag } }),
      invalidatesTags: ['Tags'],
    }),
    deleteTag: builder.mutation<void, Tag>({
      query: tag => ({ url: '/tags', method: 'DELETE', body: { tag } }),
      invalidatesTags: ['Tags', 'Students', 'StudentTags'],
    }),
    getStudentTagsByStudyTrack: builder.query<StudentTag[], string>({
      query: studyTrack => `/studenttags/${studyTrack}`,
      providesTags: ['StudentTags'],
    }),
    createStudentTags: builder.mutation<
      void,
      { combinedProgramme: string; studentTags: StudentTag[]; studyTrack: string }
    >({
      query: ({ combinedProgramme, studentTags, studyTrack }) => ({
        url: '/studenttags',
        method: 'POST',
        body: { combinedProgramme, studentTags, studyTrack },
      }),
      invalidatesTags: ['Students', 'StudentTags'],
    }),
    deleteStudentTags: builder.mutation<
      void,
      { combinedProgramme: string; tagId: string; studentNumbers: string[]; studyTrack: string }
    >({
      query: ({ combinedProgramme, tagId, studentNumbers, studyTrack }) => ({
        url: '/studenttags',
        method: 'DELETE',
        body: { combinedProgramme, tagId, studentNumbers, studyTrack },
      }),
      invalidatesTags: ['Students', 'StudentTags'],
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
