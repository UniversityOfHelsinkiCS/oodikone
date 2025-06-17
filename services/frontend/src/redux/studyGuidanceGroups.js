import { RTKApi } from '@/apiConnection'

const studyGuidanceGroupsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getAllStudyGuidanceGroups: builder.query({
      query: () => '/studyguidancegroups',
      providesTags: result => [
        // eslint-disable-next-line no-unsafe-optional-chaining
        ...result?.map(({ id }) => ({ type: 'StudyGuidanceGroups', id })),
        { type: 'StudyGuidanceGroups', id: 'LIST' },
      ],
    }),
    changeStudyGuidanceGroupTags: builder.mutation({
      query: ({ groupId, tags }) => ({
        url: `/studyguidancegroups/${groupId}/tags`,
        method: 'PUT',
        body: tags,
      }),
      invalidatesTags: ({ studyGuidanceGroupId }) => [{ type: 'StudyGuidanceGroups', id: studyGuidanceGroupId }],
    }),
  }),
  overrideExisting: false,
})

export const { useGetAllStudyGuidanceGroupsQuery, useChangeStudyGuidanceGroupTagsMutation } = studyGuidanceGroupsApi
