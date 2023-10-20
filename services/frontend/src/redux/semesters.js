import { RTKApi } from 'apiConnection'

const semestersApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getSemesters: builder.query({
      query: () => '/semesters/codes',
      providesTags: ['Semester'],
    }),
  }),
  overrideExisting: false,
})

export const { useGetSemestersQuery } = semestersApi

export default semestersApi
