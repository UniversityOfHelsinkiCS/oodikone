import { RTKApi } from 'apiConnection'

const openUniPopulationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getOpenUniCourseStudents: builder.query({
      query: ({ courseList, startdate, enddate }) =>
        `/openunisearch?courselist=${JSON.stringify(courseList)}&startdate=${startdate}&enddate=${enddate}`,
    }),
    getSavedSearches: builder.query({
      query: () => `/openunisearch/searches`,
    }),
    createOpenUniCourseSearch: builder.mutation({
      query: ({ courseList, name }) => ({
        url: '/openunisearch/searches',
        method: 'POST',
        body: {
          courselist: courseList,
          name,
        },
      }),
    }),
    updateOpenUniCourseSearch: builder.mutation({
      query: ({ id, courseList }) => ({
        url: `/openunisearch/searches/${id}`,
        method: 'PUT',
        body: {
          courselist: courseList,
        },
      }),
    }),
    deleteOpenUniCourseSearch: builder.mutation({
      query: ({ id }) => ({
        url: `/openunisearch/searches/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetOpenUniCourseStudentsQuery,
  useGetSavedSearchesQuery,
  useCreateOpenUniCourseSearchMutation,
  useDeleteOpenUniCourseSearchMutation,
  useUpdateOpenUniCourseSearchMutation,
} = openUniPopulationApi
