import { GraduationStatistics } from './graduations'
import { Name } from './name'

export type MedianEntry = {
  amount: number
  classSize: number
  name: string
  statistics: GraduationStatistics
  times: number[]
  y: number
}

export type ProgrammeOrStudyTrackGraduationStats = {
  medians: {
    basic: MedianEntry[]
    combo: MedianEntry[]
  }
}

export type Goals = {
  basic: number
  combo: number
}

export type GraduationTimes = {
  [programmeOrStudyTrack: string]: ProgrammeOrStudyTrackGraduationStats
} & {
  goals: Goals
}

export type StudyTrackStats = {
  creditCounts: Record<string, number[]>
  creditCountsCombo: Record<string, number[]>
  doCombo: boolean
  graduationTimes: GraduationTimes
  graduationTimesSecondProg: GraduationTimes
  id: string
  includeGraduated: boolean
  mainStatsByTrack: Record<string, (number | string)[][]>
  mainStatsByYear: Record<string, (number | string)[][]>
  otherCountriesCount: Record<string, Record<string, Record<string, number>>>
  populationTitles: string[]
  studyTracks: Record<string, string | Name>
  years: string[]
}
