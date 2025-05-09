import { FacultyClassSizes, GraduationStats, NameWithCode, ProgrammeMedians } from '@oodikone/shared/types'

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
  classSizes: FacultyClassSizes
  goals: {
    bachelor: number
    bcMsCombo: number
    doctor: number
    master: number
    exceptions?: Record<string, number> // ? Is this used or needed?
  }
  programmeNames: Record<string, NameWithCode>
}
