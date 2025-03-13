import { Name } from './name'

// TODO: Format for frontend and drop irrelevant fields
export type Curriculum = {
  code: string
  createdAt: string
  curriculumName: string
  curriculum_period_ids: string[]
  degreeProgrammeType: string
  group_id: string
  id: string
  minimumCredits: number
  name: Name
  order: number
  organization_id: number
  studyLevel: string | null
  type: string
  updatedAt: string
  valid_from: string
  valid_to: string | null
}

export type Module = {
  courses: ProgrammeCourse[]
  module: string // ? Should this be called code or moduleCode?
  module_order: number
}

// TODO: Format for frontend and drop irrelevant fields
export type ProgrammeCourse = {
  code: string
  created_at: string
  curriculum_period_ids: string[]
  degree_programme_type: string | null
  group_id: string
  id: string
  label: {
    id: string
    label: string
    orderNumber: number
  }
  minimum_credits: number | null
  module_order: number
  name: Name
  order: number
  organization_id: string | null
  parent_code: string
  parent_id: string | null
  study_level: string | null
  type: string
  updated_at: string
  valid_from: string
  valid_to: string | null
  visible: {
    id: string | null
    visible: boolean
  }
}

// TODO: Format for frontend and drop irrelevant fields
export type ProgrammeModule = {
  code: string
  created_at: string
  curriculum_period_ids: string[]
  degree_programme_type: string | null
  group_id: string
  id: string
  minimum_credits: number | null
  module_order: number
  name: Name
  order: number
  organization_id: string | null
  parent_code: string | null
  parent_id: string | null
  study_level: string | null
  type: string
  updated_at: string
  valid_from: string
  valid_to: string | null
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
