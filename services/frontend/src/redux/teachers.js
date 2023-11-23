import { RTKApi } from '../apiConnection'

const teachersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getTeacher: builder.query({
      query: ({ id }) => `/teachers/${id}`,
    }),
    findTeachers: builder.query({
      query: ({ searchString }) => `/teachers/?searchTerm=${searchString}`,
    }),
  }),
  overrideExisting: false,
})

export const { useGetTeacherQuery, useFindTeachersQuery } = teachersApi
