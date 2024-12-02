import { NameWithCode } from './name'

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
