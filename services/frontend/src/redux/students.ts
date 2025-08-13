import { RTKApi } from '@/apiConnection'
import { GetStudentRequest, SearchStudentsRequest, SearchStudentsResponse } from '@/types/api/students'
import { StudentPageStudent } from '@oodikone/shared/types/studentData'

const studentsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    searchStudents: builder.query<SearchStudentsResponse[], SearchStudentsRequest>({
      query: ({ searchTerm }) => `/students/?searchTerm=${searchTerm}`,
    }),
    getStudent: builder.query<StudentPageStudent, GetStudentRequest>({
      query: ({ studentNumber }) => `/students/${studentNumber}`,
      providesTags: result => (result ? [{ type: 'Students', id: result.studentNumber }] : []),
    }),
  }),
  overrideExisting: false,
})

export const { useSearchStudentsQuery, useGetStudentQuery } = studentsApi
