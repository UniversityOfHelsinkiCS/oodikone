import type { Name } from '../types'

export type CurriculumPeriod = {
  id: string
  name: Name
  universityOrgId: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
}
