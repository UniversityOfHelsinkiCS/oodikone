import { RTKApi } from '@/apiConnection'
import type {
  GetStudentRequestResBody,
  GetStudentRequestQuery,
  GetStudentDetailParams,
  GetStudentDetailResBody,
} from '@oodikone/shared/routes/students'

const studentsApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    searchStudents: builder.query<GetStudentRequestResBody, GetStudentRequestQuery>({
      query: ({ searchTerm }) => `/students/?searchTerm=${searchTerm}`,
    }),
    getStudent: builder.query<GetStudentDetailResBody, GetStudentDetailParams>({
      query: ({ studentNumber }) => `/students/${studentNumber}`,
      providesTags: result => (result ? [{ type: 'Students', id: result.studentNumber }] : []),
    }),
  }),
  overrideExisting: false,
})

export const { useSearchStudentsQuery, useGetStudentQuery } = studentsApi
