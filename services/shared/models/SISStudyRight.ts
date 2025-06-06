import type { ExtentCode, SemesterEnrollment } from '../types'

import type { Credit } from './credit'
import type { Enrollment } from './enrollment'
import type { Organization } from './organization'
import type { SISStudyRightElement } from './SISStudyRightElement'
import type { Student } from './student'
import type { Studyplan } from './studyplan'

export type SISStudyRight = {
  id: string
  facultyCode: string
  organization: Organization
  studyPlans: Studyplan[]
  studyRightElements: SISStudyRightElement[]
  startDate: Date
  endDate: Date
  studyStartDate: Date
  cancelled: boolean
  studentNumber: string
  student: Student
  extentCode: ExtentCode
  admissionType: string
  semesterEnrollments: SemesterEnrollment[] | null
  credits: Credit[]
  enrollments: Enrollment[]
  tvex: boolean
  expirationRuleUrns: string[]
  createdAt: Date
  updatedAt: Date
}
