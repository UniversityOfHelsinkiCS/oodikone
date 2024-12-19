import { RTKApi } from '@/apiConnection'

const completedCoursesSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCompletedCourses: builder.query<any, { courseList: string[]; studentList: string[] }>({
      query: ({ courseList, studentList }) =>
        `completedcoursessearch?courselist=${JSON.stringify(courseList)}&studentlist=${JSON.stringify(studentList)}`,
    }),
    getSavedCourseLists: builder.query<any, void>({
      query: () => '/completedcoursessearch/searches',
      providesTags: ['CompletedCoursesSearchList'],
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
      invalidatesTags: ['CompletedCoursesSearchList'],
    }),
    updateCourseList: builder.mutation({
      query: ({ id, courseList }) => ({
        url: `/completedcoursessearch/searches/${id}`,
        method: 'PUT',
        body: {
          courselist: courseList,
        },
      }),
      invalidatesTags: ['CompletedCoursesSearchList'],
    }),
    deleteCourseList: builder.mutation({
      query: ({ id }) => ({
        url: `/completedcoursessearch/searches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CompletedCoursesSearchList'],
    }),
  }),
})

export const {
  useGetCompletedCoursesQuery,
  useGetSavedCourseListsQuery,
  useCreateCourseListMutation,
  useUpdateCourseListMutation,
  useDeleteCourseListMutation,
} = completedCoursesSearchApi
