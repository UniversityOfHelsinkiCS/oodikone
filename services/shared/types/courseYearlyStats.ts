import { Name } from './name'

export type Programme = {
  name: Name
  students: Record<number, string[]>
  passed: Record<number, string[]>
  credits: Record<number, number>
}

type Faculty = {
  name: Name | null
  students: string[]
  passed: string[]
  credits: number
}

export type FacultyYearStats = {
  year: string
  allStudents: string[]
  allPassed: string[]
  faculties: Record<string, Faculty>
  allCredits: number
}

export type Grades = Record<string, string[]>

type GroupAttempts = {
  grades: Grades
  categories: {
    passed: string[]
    failed: string[]
  }
}

type GroupStudents = {
  grades: Record<string, { grade: string; passed: boolean }>
  studentNumbers: string[]
}

export type Group = {
  code: number
  // string: Year number as string
  // Name: semester name from DB
  name: string | Name
  coursecode: string
  attempts: GroupAttempts
  students: GroupStudents
  enrollments: { studentNumber: string; enrollmentDateTime: Date }[]
  allEnrollments: { studentNumber: string; enrollmentDateTime: Date }[]
  yearCode: number
}

export type Student = {
  code: number
  earliestAttainment: Date
}
