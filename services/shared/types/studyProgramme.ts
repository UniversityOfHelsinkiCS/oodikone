import { GraduationStatistics } from './graduations'
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
