import { GraduationStats, NameWithCode, ProgrammeMedians } from '@shared/types'

// ? Almost identical to GetFacultyGraduationTimesResponse, could be combined?
export interface GetAllGraduationStatsResponse {
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
  programmeNames: Record<string, NameWithCode>
}
