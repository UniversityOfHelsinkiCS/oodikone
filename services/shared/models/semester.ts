import type { Name } from '../types'

export type Semester = {
  composite: string
  semestercode: number
  name: Name
  startYear: number
  startdate: Date
  enddate: Date
  yearcode: number
  yearname: string
  org: string
  termIndex: number
  createdAt: Date
  updatedAt: Date
}
