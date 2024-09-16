import { EnrollmentType } from './enrollmentType'

export type SemesterEnrollment = {
  type: EnrollmentType
  semester: number
  statutoryAbsence?: boolean
}
