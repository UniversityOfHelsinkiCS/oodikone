export type PopulationSearchProgramme = {
  code: string
  name: string | undefined | null
  pinned: boolean
}

export type PopulationSearchStudyTrack = {
  code: string
  name: string | undefined | null
}

export type Semester = 'FALL' | 'SPRING'
export type StudentStatus = 'EXCHANGE' | 'NONDEGREE' | 'TRANSFERRED'
type Code = string

export type PopulationQuery = {
  years: number[]
  semesters: Semester[]
  programme: Code
  showBachelorAndMaster: boolean
  studentStatuses?: StudentStatus[]
  combinedProgramme?: Code
  studyTrack?: Code
  tag?: string
}
