import type { Name } from '../types'

import type { CourseType } from './courseType'
import type { Credit } from './credit'
import type { Enrollment } from './enrollment'
import type { Organization } from './organization'

export type Course = {
  /* COLUMNS */
  id: string
  groupId: string
  code: string
  coursetypecode: string
  isStudyModule: boolean
  isPrimary: boolean
  name: Name
  maxAttainmentDate: Date | null
  minAttainmentDate: Date | null
  createdAt: Date
  updatedAt: Date
  substitutionGroups: string[][]
  validityPeriod: { startDate?: Date; endDate?: Date } | null
  courseUnitType: string

  /* RELATIONS */
  courseType: CourseType
  credits: Credit[]
  enrollments: Enrollment[]
  organizations: Organization[]
}
