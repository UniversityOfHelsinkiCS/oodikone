import { RTKApi } from 'apiConnection'

const completedCoursesSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getCompletedCourses: builder.query({
      query: ({ courseList, studentList }) =>
        `completedcoursessearch?courselist=${JSON.stringify(courseList)}&studentlist=${JSON.stringify(studentList)}`,
    }),
    getCourseList: builder.query({
      query: ({ courseListTitle }) => `completedcoursessearch?courselisttitle=${JSON.stringify(courseListTitle)}`,
    }),
    getStudentList: builder.query({
      query: ({ studentListTitle }) => `completedcoursessearch?studentlisttitle=${JSON.stringify(studentListTitle)}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetCompletedCoursesQuery, useGetStudentListQuery, useGetCourseListQuery } = completedCoursesSearchApi
