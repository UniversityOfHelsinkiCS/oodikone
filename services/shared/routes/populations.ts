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
   * enrolledNoGrade: string[] - this is not set in the backend
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
  semesters: string[]
  studentStatuses?: string[]
  // NOTE: This param is a JSON -object
  studyRights: string
  year: string
  years?: string[]
}
