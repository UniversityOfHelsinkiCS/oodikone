import { MedianEntry } from './studyProgramme'

export type FacultyClassSizes = {
  bachelor: Record<string, number>
  bcMsCombo: Record<string, number>
  master: Record<string, number>
  doctor: Record<string, number>
  programmes: Record<
    string,
    {
      bachelor: Record<string, number>
      bcMsCombo: Record<string, number>
      master: Record<string, number>
      doctor: Record<string, number>
    }
  >
}

export type ProgrammeClassSizes = {
  programme: Record<string, number>
  studyTracks: Record<string, Record<string, number>>
}

export type GraduationStatistics = {
  onTime: number
  yearOver: number
  wayOver: number
}

export type ChartGraduationTimes = {
  medians: MedianEntry[]
  goal: number
}

export type GraduationStats = {
  amount: number
  code?: string
  median: number
  name: string
  statistics: GraduationStatistics
  times: number[] | null
}

export type ProgrammeMedians = Record<number, { data: GraduationStats[]; programmes: string[] }>
