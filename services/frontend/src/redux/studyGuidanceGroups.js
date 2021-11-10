import { RTKApi } from 'apiConnection'

const studyGuidanceGroupsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getAllStudyGuidanceGroups: builder.query({
      query: () => '/studyguidancegroups',
      providesTags: result => [
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
    getStudyGuidanceGroupPopulation: builder.query({
      query: studentnumberlist => ({
        url: '/v3/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: { studentnumberlist, usingStudyGuidanceGroups: true },
      }),
    }),
    getStudyGuidanceGroupPopulationCourses: builder.query({
      query: studentnumberlist => ({
        url: '/v2/populationstatistics/coursesbystudentnumberlist',
        method: 'POST',
        body: { studentnumberlist, usingStudyGuidanceGroups: true },
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetAllStudyGuidanceGroupsQuery,
  useChangeStudyGuidanceGroupTagsMutation,
  useGetStudyGuidanceGroupPopulationQuery,
  useGetStudyGuidanceGroupPopulationCoursesQuery,
} = studyGuidanceGroupsApi
