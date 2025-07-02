import { Name, EnrollmentState } from '../types'

type Course = {
  code: string
  name: Name
  substitutions: string[]
}

type EnrollmentObject = {
  [EnrollmentState.ENROLLED]: string[]
  [EnrollmentState.REJECTED]: string[]
}

export type CourseStats = {
  course: Course
  attempts: number
  enrollments: EnrollmentObject & {
    semesters: { [semester: string]: EnrollmentObject }
  }
  grades: {
    [grade: string]: {
      count: number
      status: {
        passingGrade: boolean
        failingGrade: boolean
        improvedGrade: boolean
      }
    }
  }
  /**
   * all: string[]
   * passed: string[]
   * failed: string[]
   * improvedPassedGrade: string[]
   * markedToSemester: string[]
   * enrolledNoGrade: string[]
   */
  students: {
    [key: string]: string[]
  }
  stats: {
    passingSemesters: {
      [semester: string]: number
    }
  }
}

export type PopulationstatisticsResBody = { students: any; coursestatistics: CourseStats[] }
export type PopulationstatisticsReqBody = never
export type PopulationstatisticsQuery = {
  years: string[]
  semesters: string[]
  programme: string
  combinedProgramme?: string
  studyTrack?: string
  studentStatuses?: string[]
}
