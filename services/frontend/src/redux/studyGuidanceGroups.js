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
    getStudyGuidanceGroupPopulation: builder.query({
      query: ({ studentnumberlist, tags }) => ({
        url: '/v3/populationstatisticsbystudentnumbers',
        method: 'POST',
        body: { studentnumberlist, tags, usingStudyGuidanceGroups: true },
      }),
    }),
    getStudyGuidanceGroupPopulationCourses: builder.query({
      query: ({ studentnumberlist, year }) => ({
        url: '/v2/populationstatistics/coursesbystudentnumberlist',
        method: 'POST',
        body: { studentnumberlist, usingStudyGuidanceGroups: true, year },
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
