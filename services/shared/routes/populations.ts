import { Name, EncrypterData } from '../types'

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

export type Bottlenecks = {
  allStudents: number
  coursestatistics: CourseStatistics[]
}

export type PopulationstatisticsCoursesResBody = Bottlenecks
export type PopulationstatisticsCoursesReqBody = {
  // NOTE: Encrypted students have their iv in selectedStudents
  selectedStudents: string[] | EncrypterData[]
  selectedStudentsByYear?: { [year: string]: string[] }
  courses?: string[]
}
