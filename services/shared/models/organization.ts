import type { Name } from '../types'

import type { Course } from './course'
import type { ProgrammeModule } from './programmeModule'
import type { SISStudyRight } from './SISStudyRight'

export type Organization = {
  id: string
  code: string
  name: Name
  parent_id: string
  children: Organization[]
  programmeModules: ProgrammeModule[]
  SISStudyRights: SISStudyRight[]
  courses: Course[]
  createdAt: Date
  updatedAt: Date
}
