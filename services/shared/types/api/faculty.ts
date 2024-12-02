import { Name, NameWithCode } from '../name'

export type Graduated = 'GRADUATED_INCLUDED' | 'GRADUATED_EXCLUDED'
export type SpecialGroups = 'SPECIAL_INCLUDED' | 'SPECIAL_EXCLUDED'
export type ProgrammeFilter = 'NEW_STUDY_PROGRAMMES' | 'ALL_PROGRAMMES'
export type YearType = 'ACADEMIC_YEAR' | 'CALENDAR_YEAR'
export type StatsType = 'ALL' | 'CREDITS' | 'STUDENT' | 'THESIS'

export interface GetFacultiesResponse {
  code: string
  id: string
  name: Name
}

export interface GetAllProgressStatsRequest {
  graduated: Graduated
  includeSpecials: boolean
}

export interface GetAllProgressStatsResponse {
  bachelorsProgStats: Record<string, number[][]>
  bcMsProgStats: Record<string, number[][]>
  creditCounts: Record<string, Record<string, number[]>>
  doctoralProgStats: Record<string, number[][]>
  mastersProgStats: Record<string, number[][]>
  programmeNames: Record<string, NameWithCode>
  yearlyBachelorTitles: string[][]
  yearlyBcMsTitles: string[][]
  yearlyMasterTitles: string[][]
  years: string[]
}
