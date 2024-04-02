import { RTKApi } from '@/apiConnection'

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
    getTopTeachers: builder.query({
      query: ({ yearcode, category }) => `/teachers/top?yearcode=${yearcode}&category=${category}`,
    }),
    getTopTeachersCategories: builder.query({
      query: () => '/teachers/top/categories',
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetTeacherQuery,
  useFindTeachersQuery,
  useLazyGetTeacherStatisticsQuery,
  useLazyGetTopTeachersQuery,
  useGetTopTeachersCategoriesQuery,
} = teachersApi
