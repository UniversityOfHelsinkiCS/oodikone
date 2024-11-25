import { NameWithCode } from './name'

export type GraduationStats = {
  amount: number
  median: number
  name: number
  statistics: {
    onTime: number
    yearOver: number
    wayOver: number
  }
  times: number[]
}

export interface AllGraduationStatsResponse {
  byGradYear: {
    medians: {
      bachelor: GraduationStats[]
      bcMsCombo: GraduationStats[]
      doctor: GraduationStats[]
      master: GraduationStats[]
    }
    programmes: {
      medians: {
        bachelor: Record<string, { data: GraduationStats[] & { code: string }; programmes: string[] }>
        bcMsCombo: Record<string, { data: GraduationStats[] & { code: string }; programmes: string[] }>
        doctor: Record<string, { data: GraduationStats[] & { code: string }; programmes: string[] }>
        master: Record<string, { data: GraduationStats[] & { code: string }; programmes: string[] }>
      }
    }
  }
  classSizes: {
    bachelor: Record<string, number>
    bcMsCombo: Record<string, number>
    doctor: Record<string, number>
    master: Record<string, number>
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
