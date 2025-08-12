import { RTKApi } from '@/apiConnection'

import type { GroupsWithTags } from '@oodikone/shared/types/studyGuidanceGroup'

const studyGuidanceGroupsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getAllStudyGuidanceGroups: builder.query<GroupsWithTags[], void>({
      query: () => '/studyguidancegroups',
      providesTags: result =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'StudyGuidanceGroups' as const, id })),
              { type: 'StudyGuidanceGroups', id: 'LIST' },
            ]
          : [{ type: 'StudyGuidanceGroups', id: 'LIST' }],
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
