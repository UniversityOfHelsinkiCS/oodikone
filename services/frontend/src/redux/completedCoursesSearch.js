import { RTKApi } from '@/apiConnection'

const completedCoursesSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCompletedCourses: builder.query({
      query: ({ courseList, studentList }) =>
        `completedcoursessearch?courselist=${JSON.stringify(courseList)}&studentlist=${JSON.stringify(studentList)}`,
    }),
    getSavedCourseLists: builder.query({
      query: () => '/completedcoursessearch/searches',
    }),
    createCourseList: builder.mutation({
      query: ({ courseList, name }) => ({
        url: '/completedcoursessearch/searches',
        method: 'POST',
        body: {
          courselist: courseList,
          name,
        },
      }),
    }),
    updateCourseList: builder.mutation({
      query: ({ id, courseList }) => ({
        url: `/completedcoursessearch/searches/${id}`,
        method: 'PUT',
        body: {
          courselist: courseList,
        },
      }),
    }),
    deleteCourseList: builder.mutation({
      query: ({ id }) => ({
        url: `/completedcoursessearch/searches/${id}`,
        method: 'DELETE',
      }),
    }),
    overrideExisting: false,
  }),
})

export const {
  useGetCompletedCoursesQuery,
  useGetSavedCourseListsQuery,
  useCreateCourseListMutation,
  useUpdateCourseListMutation,
  useDeleteCourseListMutation,
} = completedCoursesSearchApi
