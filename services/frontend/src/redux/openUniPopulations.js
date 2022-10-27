import { RTKApi } from 'apiConnection'

const openUniPopulationApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getOpenUniCourseStudents: builder.query({
      query: ({ courses }) => ({
        url: '/openunisearch',
        method: 'POST',
        body: {
          courselist: courses,
        },
      }),
    }),
  }),
  overrideExisting: false,
})

// eslint-disable-next-line import/prefer-default-export
export const { useGetOpenUniCourseStudentsQuery } = openUniPopulationApi
