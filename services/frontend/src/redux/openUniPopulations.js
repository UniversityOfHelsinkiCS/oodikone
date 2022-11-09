import { RTKApi } from 'apiConnection'

const openUniPopulationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getOpenUniCourseStudents: builder.query({
      query: ({ courseList, startdate, enddate }) => ({
        url: '/openunisearch',
        method: 'POST',
        body: {
          courselist: courseList,
          startdate,
          enddate,
        },
      }),
    }),
  }),
  overrideExisting: false,
})

// eslint-disable-next-line import/prefer-default-export
export const { useGetOpenUniCourseStudentsQuery } = openUniPopulationApi
