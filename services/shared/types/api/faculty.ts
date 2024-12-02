import { Name, NameWithCode } from '../name'

export interface GetFacultiesResponse {
  code: string
  createdAt: string
  id: string
  name: Name
  parent_id: string
  updatedAt: string
}

export interface GetAllProgressStatsRequest {
  graduated: 'GRADUATED_EXCLUDED' | 'GRADUATED_INCLUDED'
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
