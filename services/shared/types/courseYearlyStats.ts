import { Name } from './name'

export type Programme = {
  name: Name
  students: Record<number, string[]>
  passed: Record<number, string[]>
  credits: Record<number, number>
}

type Faculty = {
  name: Name
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

// TODO: combine with "Realisation" brought here from frontend.
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

// Fields are undefined only in case of early return due to error
export type CourseYearlyStats = { openStats: CourseStat; regularStats: CourseStat; unifyStats: CourseStat }

export type YearlyStatsByCourse = Record<string, CourseYearlyStats>

export type Realisation = {
  allEnrollments: Enrollment[]
  attempts: Attempts
  code: number
  coursecode: string
  enrollments: Enrollment[]
  name: string | Name
  obfuscated?: boolean
  students: Students
  yearCode: number
}

export type Enrollment = {
  enrollmentDateTime: Date
  studentNumber: string
}

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

export type CourseStat = {
  substitutionGroups: { code: string; name: Name; groupId: string }[][]
  courseCode: string
  groupId: string
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
