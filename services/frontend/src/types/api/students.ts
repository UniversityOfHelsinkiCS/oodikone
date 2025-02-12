import { Name } from '@/shared/types'

export type SearchStudentsRequest = {
  searchTerm: string
}

export type SearchStudentsResponse = {
  courses: any[]
  credits: number
  firstnames: string
  lastname: string
  started: string
  studentNumber: string
  studyRights: {
    id: string
    studyRightElements: {
      name: Name
    }[]
  }[]
  studyplans: any[]
}

export type GetStudentRequest = {
  studentNumber: string | undefined
}
