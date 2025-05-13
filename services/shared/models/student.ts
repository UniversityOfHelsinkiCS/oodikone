import type { Name, GenderCode } from '../types'

import type { Credit } from './credit'
import type { Enrollment } from './enrollment'
import type { SISStudyRight } from './SISStudyRight'
import type { Studyplan } from './studyplan'

export type Student = {
  studentnumber: string
  lastname: string
  firstnames: string
  abbreviatedname: string
  enrollments: Enrollment[]
  studyRights: SISStudyRight[]
  studyplans: Studyplan[]
  credits: Credit[]
  birthdate: Date
  creditcount: number
  dateofuniversityenrollment: Date
  email: string
  secondary_email: string
  national_student_number: string
  phone_number: string
  citizenships: Name[]
  gender_code: GenderCode
  sis_person_id: string
  hasPersonalIdentityCode: boolean
  preferredLanguage: string
  createdAt: Date
  updatedAt: Date
}
