import { Name } from '@/shared/types'

export type FacultyStat = {
  allCredits: number
  allPassed: string[]
  allStudents: string[]
  faculties: Record<
    string,
    {
      credits: number
      name: Name
      passed: string[]
      students: string[]
    }
  >
  year: string
}

type Enrollment = {
  studentNumber: string
  enrollmentDateTime: string
}

export type Realisation = {
  allEnrollments: Enrollment[]
  attempts: {
    categories: {
      failed: string[]
      passed: string[]
    }
    grades: Record<string, string[]>
  }
  code: number
  coursecode: string
  enrollments: Enrollment[]
  name: string
  obfuscated?: boolean
  students: {
    grades: Record<string, string[]>
    studentNumbers: string[]
  }
  yearCode: number
}

export type CourseStat = {
  alternatives: { code: string; name: Name }[]
  coursecode: string
  facultyStats: Record<string, FacultyStat>
  name: Name
  obfuscated: boolean
  programmes: Record<
    string,
    {
      credits: Record<string, number>
      name: Name
      passed: Record<string, string[]>
      students: Record<string, string[]>
    }
  >
  statistics: Realisation[]
}
