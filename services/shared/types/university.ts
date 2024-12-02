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

export type ProgrammeMedians = Record<number, { data: Array<GraduationStats & { code: string }>; programmes: string[] }>
