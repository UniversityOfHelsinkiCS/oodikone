import type { Name, DegreeProgrammeType } from '../types'

export type ProgrammeModule = {
  id: string
  group_id: string
  code: string
  name: Name
  type: 'course' | 'module'
  order: number
  studyLevel: string | null
  organization_id: string | null
  valid_from: Date
  valid_to: Date
  curriculum_period_ids: string[]
  degreeProgrammeType: DegreeProgrammeType | null
  minimumCredits: number | null
  createdAt: Date
  updatedAt: Date
}
