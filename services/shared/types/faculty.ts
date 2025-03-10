import { GraduationStatistics } from './graduations'

export type Graduated = 'GRADUATED_INCLUDED' | 'GRADUATED_EXCLUDED'
export type ProgrammeFilter = 'NEW_STUDY_PROGRAMMES' | 'ALL_PROGRAMMES'
export type SpecialGroups = 'SPECIAL_INCLUDED' | 'SPECIAL_EXCLUDED'
export type StatsType = 'ALL' | 'CREDITS' | 'STUDENT' | 'THESIS'
export type YearType = 'ACADEMIC_YEAR' | 'CALENDAR_YEAR'

export type GraduationStats = {
  amount: number
  median: number
  name: number
  statistics: GraduationStatistics
  times: number[]
}

export type ProgrammeMedians = Record<number, { data: Array<GraduationStats & { code: string }>; programmes: string[] }>
