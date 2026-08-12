import { Enrollment } from '@oodikone/shared/types/courseYearlyStats'

export type FormattedStats = {
  attempts: {
    categories: {
      failed: number
      passed: number
    }
    grades: Record<string, number>
    passRate: number
    totalAttempts?: number
    totalEnrollments?: number
  }
  code: number
  coursecode: string
  enrollments?: Enrollment[]
  name: string
  rowObfuscated?: boolean
  students: {
    enrolledStudentsWithNoGrade: number | undefined
    failRate: number
    grades: Record<string, number>
    passRate: number
    total: number
    totalEnrollments: number | undefined
    totalFailed: number
    totalPassed: number
  }
}

export type ProgrammeStats = {
  codes: string[]
  name: string
  stats: FormattedStats[]
  totals: FormattedStats
  userHasAccessToAllStats: boolean
}

export type AvailableStats = { unify: boolean; open: boolean; university: boolean }

export type ViewMode = 'ATTEMPTS' | 'STUDENTS'
