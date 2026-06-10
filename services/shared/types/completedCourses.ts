import { Course } from '../models'
import { CreditTypeCode } from '../types'

type StudentCredit = {
  date: Date
  courseCode: string
  creditType: CreditTypeCode
  substitution: string[] | null
}

type StudentEnrollment = {
  date: Date
  courseCode: string
  substitution: string[] | null
}

type StudentInfo = {
  firstnames: string
  lastname: string
  email: string
  sis_person_id: string
  coursesInStudyPlan: string[]
  secondaryEmail: string | null
  credits: StudentCredit[]
  enrollments: Record<string, StudentEnrollment>
}

export type StudentCredits = Record<
  string,
  Omit<StudentInfo, 'credits' | 'enrollments'> & {
    credits: StudentCredit[]
    enrollments: StudentEnrollment[]
  }
>

export type CompletedCoursesStudent = StudentInfo & {
  studentNumber: string
  allEnrollments: StudentEnrollment[]
}

export type CompletedCoursesCourse = Pick<Course, 'code' | 'name' | 'substitution_groups'>
