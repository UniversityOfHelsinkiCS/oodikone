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

export type Enrollment = {
  enrollmentDateTime: string
  studentNumber: string
}

export type Attempts = {
  categories: {
    failed: string[]
    passed: string[]
  }
  grades: Record<string, string[]>
}

export type Students = {
  grades: Record<string, string[]>
  studentNumbers: string[]
}

export type Realisation = {
  allEnrollments: Enrollment[]
  attempts: Attempts
  code: number
  coursecode: string
  enrollments: Enrollment[]
  name: string
  obfuscated?: boolean
  students: Students
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
