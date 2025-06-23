import { Name, EncrypterData, EnrollmentState } from '../types'

type Stats = {
  students: number
  passed: number
  failed: number
  attempts: number
  improvedPassedGrade: number
  percentage: number | undefined
  passedOfPopulation: number | undefined
  triedOfPopulation: number | undefined
  perStudent: number | undefined
  passingSemesters: Record<string, number>
  passingSemestersCumulative?: Record<string, number>
  totalStudents?: number
  totalEnrolledNoGrade?: number
  percentageWithEnrollments?: number
}

type Students = {
  all: Record<string, boolean>
  passed: Record<string, boolean>
  failed: Record<string, boolean>
  improvedPassedGrade: Record<string, boolean>
  markedToSemester: Record<string, boolean>
  enrolledNoGrade: Record<string, boolean>
}

type Course = {
  code: string
  name: Name
  substitutions: string[]
}

type Grades = {
  [grade: string]: {
    count: number
    status: {
      passingGrade: boolean
      improvedGrade: boolean
      failingGrade: boolean
    }
  }
}

export type CourseStatistics = {
  stats: Stats
  students: Students
  course: Course
  grades: Grades
}

export type PopulationstatisticsCoursesResBody = { coursestatistics: CourseStatistics[] }
export type PopulationstatisticsCoursesReqBody = {
  // NOTE: Encrypted students have their iv in selectedStudents
  selectedStudents: string[] | EncrypterData[]
  selectedStudentsByYear?: { [year: string]: string[] }
  courses?: string[]
}

type EnrollmentObject = {
  [EnrollmentState.ENROLLED]: string[]
  [EnrollmentState.REJECTED]: string[]
}

export type CourseStats = {
  course: Course
  attempts: number
  enrollments: EnrollmentObject & {
    [semester: string]: EnrollmentObject
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
  students: {
    all: string[]
    passed: string[]
    failed: string[]
    improvedPassedGrade: string[]
    markedToSemester: string[]
    enrolledNoGrade: string[]
  }
  stats: {
    passingSemesters: {
      [semester: string]: number
    }
  }
}
