import { RTKApi } from '../apiConnection'

const teachersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getTeacher: builder.query({
      query: ({ id }) => `/teachers/${id}`,
    }),
    findTeachers: builder.query({
      query: ({ searchString }) => `/teachers/?searchTerm=${searchString}`,
    }),
    getTeacherStatistics: builder.query({
      query: ({ semesterStart, semesterEnd, providers }) =>
        `/teachers/stats?${providers
          .map(provider => `providers[]=${provider}`)
          .join('&')}&semesterStart=${semesterStart}&semesterEnd=${semesterEnd}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetTeacherQuery, useFindTeachersQuery, useLazyGetTeacherStatisticsQuery } = teachersApi
