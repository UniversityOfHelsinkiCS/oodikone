import { Name } from './name'
import { ProgrammeCourse, ProgrammeModule } from './studyProgramme'

export type CurriculumOption = {
  id: string
  name: string
  periodIds: string[]
  validFrom: Date
}

export type CurriculumDetails = {
  defaultProgrammeCourses: ProgrammeCourse[]
  defaultProgrammeModules: ProgrammeModule[]
  secondProgrammeCourses: ProgrammeCourse[]
  secondProgrammeModules: ProgrammeModule[]
}

export type CurriculumPeriod = {
  createdAt: string
  endDate: string
  id: string
  name: Name
  startDate: string
  universityOrgId: string
  updatedAt: string
}
