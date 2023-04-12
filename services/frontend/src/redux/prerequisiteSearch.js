import { RTKApi } from 'apiConnection'

const prerequisiteSearchApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getPrerequisiteTable: builder.query({
      query: ({ courseList, studentList }) =>
        `prerequisitesearch?courselist=${JSON.stringify(courseList)}&studentlist=${JSON.stringify(studentList)}`,
    }),
    getCourseList: builder.query({
      query: ({ courseListTitle }) => `prerequisitesearch?courselisttitle=${JSON.stringify(courseListTitle)}`,
    }),
    getStudentList: builder.query({
      query: ({ studentListTitle }) => `prerequisitesearch?studentlisttitle=${JSON.stringify(studentListTitle)}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetPrerequisiteTableQuery, useGetStudentListQuery, useGetCourseListQuery } = prerequisiteSearchApi
