// TODO: Remove 'status', 'lastUpdated' and any other redundant fields from responses

import { GraduationStats, Name, NameWithCode, ProgrammeMedians } from '@/shared/types'
import { Graduated, ProgrammeFilter, SpecialGroups, YearType } from '@/shared/types/faculty'
import { GraphStat } from '@/types/graphStat'

type Info = {
  graphStats: GraphStat[]
  programmeTableStats: Record<string, number[][]>
  tableStats: number[][]
  titles: string[]
}

type FacultyStats = {
  graduationInfo: Info
  id: string
  lastUpdated: string
  programmeNames: Record<string, NameWithCode>
  status: string
  studentInfo: Info
  years: number[]
}

export type GetFacultyBasicStatsResponse = FacultyStats

export type GetFacultyBasicStatsRequest = {
  id: string
  yearType: YearType
  studyProgrammeFilter: ProgrammeFilter
  specialGroups: SpecialGroups
}

export type GetFacultyCreditStatsResponse = {
  codes: string[]
  ids: string[]
  programmeNames: Record<string, NameWithCode>
}

export type GetFacultyCreditStatsRequest = {
  id: string
  yearType: YearType
}

export type GetFacultyThesisStatsResponse = {
  graphStats: GraphStat[]
  id: string
  lastUpdated: string
  programmeNames: Record<string, NameWithCode>
  programmeTableStats: Record<string, number[][]>
  status: string
  tableStats: number[][]
  titles: string[]
  years: number[]
}

export type GetFacultyThesisStatsRequest = {
  id: string
  yearType: YearType
  studyProgrammeFilter: ProgrammeFilter
  specialGroups: SpecialGroups
}

export type GetFacultyGraduationTimesResponse = {
  byGradYear: {
    medians: {
      bachelor: GraduationStats[]
      bcMsCombo: GraduationStats[]
      doctor: GraduationStats[]
      master: GraduationStats[]
    }
    programmes: {
      medians: {
        bachelor: ProgrammeMedians
        bcMsCombo: ProgrammeMedians
        doctor: ProgrammeMedians
        master: ProgrammeMedians
      }
    }
  }
  classSizes: {
    bachelor: Record<string, number>
    bcMsCombo: Record<string, number>
    doctor: Record<string, number>
    master: Record<string, number>
    programmes: {
      [code: string]: {
        bachelor: Record<string, number>
        bcMsCombo: Record<string, number>
        master: Record<string, number>
        doctor: Record<string, number>
      }
    }
  }
  goals: {
    bachelor: number
    bcMsCombo: number
    doctor: number
    master: number
    exceptions?: Record<string, number> // ? Is this used or needed?
  }
  id: string
  lastUpdated: string
  programmeNames: Record<string, Name>
  status: string
}

export type GetFacultyGraduationTimesRequest = {
  id: string
  studyProgrammeFilter: ProgrammeFilter
}

export type GetFacultiesResponse = {
  code: string
  id: string
  name: Name
}

export type GetFacultyProgressStatsResponse = {
  bachelorsProgStats: Record<string, number[][]>
  bcMsProgStats: Record<string, number[][]>
  creditCounts: Record<string, Record<string, number[]>>
  doctoralProgStats: Record<string, number[][]>
  id: string
  lastUpdated: string
  mastersProgStats: Record<string, number[][]>
  programmeNames: Record<string, NameWithCode>
  status: string
  yearlyBachelorTitles: string[][]
  yearlyBcMsTitles: string[][]
  yearlyMasterTitles: string[][]
  years: string[]
}

export type GetFacultyProgressStatsRequest = {
  id: string
  specialGroups: SpecialGroups
  graduated: Graduated
}

export type GetAllProgressStatsRequest = {
  graduated: Graduated
  includeSpecials: boolean
}

export type GetAllProgressStatsResponse = {
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

export type DegreeProgramme = {
  code: string
  curriculumPeriodIds: string[]
  degreeProgrammeType: string
  name: Name
  progId: string
}

export type CombinedDegreeProgramme = Omit<DegreeProgramme, 'curriculumPeriodIds' | 'degreeProgrammeType'> & {
  combinedCode: string
}

export type GetFacultyStudentStatsResponse = {
  facultyTableStats: Record<string, (number | string)[]>
  facultyTableStatsExtra: Record<string, Record<string, Record<string, number>>>
  id: string
  lastUpdated: string
  programmeNames: Record<string, DegreeProgramme>
  programmeStats: Record<string, Record<string, (number | string)[]>>
  status: string
  titles: string[]
  years: string[]
}

export type GetFacultyStudentStatsRequest = {
  id: string
  specialGroups: SpecialGroups
  graduated: Graduated
}

export type UpdateFacultyBasicTabResponse = undefined

export type UpdateFacultyBasicTabRequest = {
  id: string
  statsType: 'CREDITS' | 'STUDENT' | 'THESIS'
}

export type UpdateFacultyProgressTabResponse = undefined

export type UpdateFacultyProgressTabRequest = {
  id: string
}
