import type { Name, DegreeProgrammeType } from '../types'

import type { Organization } from './organization'

export type ProgrammeModule = {
  id: string
  parents: ProgrammeModule[]
  children: ProgrammeModule[]
  group_id: string
  code: string
  name: Name
  type: 'course' | 'module'
  order: number
  studyLevel: string
  organization_id: string
  organization: Organization
  valid_from: Date
  valid_to: Date
  curriculum_period_ids: string[]
  degreeProgrammeType: DegreeProgrammeType | null
  minimumCredits: number | null
  createdAt: Date
  updatedAt: Date
}
