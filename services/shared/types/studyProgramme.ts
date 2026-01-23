import { ChartGraduationTimes, GraduationStatistics } from './graduations'
import { Name } from './name'

export type StudyProgrammeCourse = {
  code: string
  isStudyModule: boolean
  name: Name
  years: Record<
    number,
    {
      isStudyModule?: boolean
      totalAllStudents: number
      totalPassed: number
      totalNotCompleted: number
      totalAllCredits: number
      totalProgrammeStudents: number
      totalProgrammeCredits: number
      totalOtherProgrammeStudents: number
      totalOtherProgrammeCredits: number
      totalWithoutStudyRightStudents: number
      totalWithoutStudyRightCredits: number
      totalTransferCredits: number
      totalTransferStudents: number
    }
  >
}

export type MedianEntry = {
  amount: number
  classSize?: number
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

// eslint-disable-next-line import-x/no-unused-modules
export type Goals = {
  basic: number
  combo: number
}

export type GraduationTimes = Record<string, ProgrammeOrStudyTrackGraduationStats> & {
  goals: Goals
}

// Used in faculty as well
export type CreditStats = {
  id: string
  stats: Record<string, Record<string, number>>
}

export type CreditStatsPayload = Record<string, CreditStats>

export type BasicStats = {
  id: string
  years: number[]
  graphStats: {
    name: string
    data: number[]
  }[]
  tableStats: number[][]
  titles: string[]
}

export type ProgrammeGraduationStats = {
  id: string
  years: number[]
  tableStats: (string | number)[][]
  titles: string[]
  graphStats: { name: string; data: number[] }[]
  graduationTimes: ChartGraduationTimes
  doCombo: boolean
  comboTimes: ChartGraduationTimes
  graduationTimesSecondProgramme: ChartGraduationTimes
  programmesBeforeOrAfterTableStats: (string | number | Name)[][] | undefined
  programmesBeforeOrAfterGraphStats: { name: Name; code: string; data: number[] }[] | undefined
  programmesBeforeOrAfterTitles: (string | number)[]
}

export type StudyTrackStats = {
  creditCounts: Record<string, number[]>
  creditCountsCombo: Record<string, number[]>
  doCombo: boolean
  graduatedCount: Record<string, number>
  graduationTimes: GraduationTimes
  graduationTimesSecondProg: GraduationTimes
  id: string
  mainStatsByTrack: Record<string, (number | string)[][]>
  mainStatsByYear: Record<string, (number | string)[][]>
  otherCountriesCount: Record<string, Record<string, Record<string, number>>>
  populationTitles: string[]
  studyTracks: Record<string, string | Name>
  years: string[]
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
  parent_name: Name
  study_level: string | null
  type: string
  updated_at: string
  valid_from: string
  valid_to: string | null
}

// TODO: Format for frontend and drop irrelevant fields
export type ProgrammeCourse = ProgrammeModule & {
  label: {
    id: string
    label: string
    orderNumber: number
  }
  visible: {
    id: string | null
    visibility: boolean
  }
}

export type Module = {
  code: string
  courses: ProgrammeCourse[]
  order: number
}
