import { Name } from '@/shared/types'

export type SearchStudentsRequest = {
  searchTerm: string
}

export type ActiveStudyRight = {
  id: string
  studyRightElements: {
    name: Name
  }[]
}

export type SearchStudentsResponse = {
  activeStudyRights: ActiveStudyRight[]
  credits: number
  firstNames: string
  lastName: string
  started: string | null
  studentNumber: string
}

export type GetStudentRequest = {
  studentNumber: string | undefined
}
