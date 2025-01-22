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
  statistics: Record<
    string,
    {
      allEnrollments: string[]
      attempts: {
        categories: {
          failed: string[]
          passed: string[]
        }
        grades: Record<string, string[]>
      }
      code: number
      coursecode: string
      enrollments: string[]
      name: string
      students: {
        grades: Record<string, string[]>
        studentNumber: string[]
      }
      yearCode: number
    }
  >
}
