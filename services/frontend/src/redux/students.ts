import { RTKApi } from '@/apiConnection'
import { GetStudentRequest, SearchStudentsRequest, SearchStudentsResponse } from '@/types/api/students'

const studentsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    searchStudents: builder.query<SearchStudentsResponse[], SearchStudentsRequest>({
      query: ({ searchTerm }) => `/students/?searchTerm=${searchTerm}`,
    }),
    getStudent: builder.query<any, GetStudentRequest>({
      query: ({ studentNumber }) => `/students/${studentNumber}`,
      providesTags: result => (result ? [{ type: 'Students', id: result.studentNumber }] : []),
    }),
  }),
  overrideExisting: false,
})

export const { useSearchStudentsQuery, useGetStudentQuery } = studentsApi
