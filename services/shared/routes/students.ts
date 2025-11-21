import { FormattedStudentForSearch, StudentPageStudent } from '../types/studentData'

// students/
export type GetStudentRequestResBody = FormattedStudentForSearch[]
export type GetStudentRequestReqBody = never
export type GetStudentRequestQuery = { searchTerm: string }

// students/:studentNumber
export type GetStudentDetailParams = { studentNumber: string }
export type GetStudentDetailResBody = StudentPageStudent
export type GetStudentDetailReqBody = never
