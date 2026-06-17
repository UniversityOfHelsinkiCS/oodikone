import { Name, NameWithCode } from './name'
import { MedianEntry } from './studyProgramme'

/** Used with University/Faculty graduations -> "programmes" are either faculties or programmes depending on context */
export type ClassSizes = {
  bachelor: Record<string, number>
  bcMsCombo: Record<string, number>
  master: Record<string, number>
  doctor: Record<string, number>
  programmes: Record<string, Record<string, number>> | Record<string, number>
}

export type ProgrammeClassSizes = {
  programme: Record<string, number>
  studyTracks: Record<string, Record<string, number>>
}

export type GraduationTimeCategories = {
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
  statistics: GraduationTimeCategories
  times: number[]
}

export type ProgrammeMedians = Record<string, { data: GraduationStats[]; programmes: string[] }>

export type MediansByCategory = {
  bachelor: GraduationStats[]
  bcMsCombo: GraduationStats[]
  doctor: GraduationStats[]
  master: GraduationStats[]
}

export type MediansByProgrammes = {
  bachelor: ProgrammeMedians
  bcMsCombo: ProgrammeMedians
  doctor: ProgrammeMedians
  master: ProgrammeMedians
}

export type GraduationStatistics = {
  byGradYear: {
    medians: MediansByCategory
    programmes: {
      medians: MediansByProgrammes
    }
  }
  byStartYear: {
    medians: MediansByCategory
    programmes: {
      medians: MediansByProgrammes
    }
  }
  classSizes: ClassSizes
  /** Numbers are the amount of semesters for target graduation time */
  goals: {
    bachelor: number
    bcMsCombo: number
    doctor: number
    master: number
    exceptions?: Record<string, number>
  }
  programmeNames: Record<string, NameWithCode>
}

export type FacultyGraduationStatistics = Omit<GraduationStatistics, 'programmeNames'> & {
  id: string // Faculty code
  programmeNames: Record<string, Name>
}

export type UniversityGraduationStatistics = Omit<GraduationStatistics, 'byStartYear' | 'classSizes'> & {
  classSizes: { programmes: Record<string, GraduationStatistics['classSizes']['programmes']> }
}
