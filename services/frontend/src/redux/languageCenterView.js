import { RTKApi } from 'apiConnection'

const languageCenterApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getLanguageCenterData: builder.query({
      query: () => `languagecenterdata`,
    }),
    getLanguageCenterCourses: builder.query({
      query: () => `languagecenterdata/courses`,
    }),
  }),
})

export const { useGetLanguageCenterDataQuery, useGetLanguageCenterCoursesQuery } = languageCenterApi
