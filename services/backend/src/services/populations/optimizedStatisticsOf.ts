import { omitKeys } from '@oodikone/shared/util'
import { getDegreeProgrammeType } from '../../util'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { formatStudentForAPI } from './formatStatisticsForApi'
import {
  type StudentEnrollment,
  type StudentCredit,
  getStudents,
  getEnrollments,
  getCredits,
  StudentTags,
} from './getStudentData'
import { getOptionsForStudents } from './shared'

export type OptimizedStatisticsQuery = {
  userId: string
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string | string[]
  years: string[]
}

export type AnonymousEnrollment = Omit<StudentEnrollment, 'studentnumber'>
export type AnonymousCredit = Omit<StudentCredit, 'student_studentnumber'>

export type StudentEnrollmentObject = Record<StudentEnrollment['studentnumber'], AnonymousEnrollment[]>
export type StudentCreditObject = Record<StudentCredit['student_studentnumber'], AnonymousCredit[]>

export const optimizedStatisticsOf = async (
  studentNumbers: string[],
  studyRights: string[],
  tagList: Record<string, StudentTags[]>,
  startDate?: string
) => {
  const mockedStartDate = startDate ?? new Date(1900).toISOString()

  const code = studyRights[0] ?? ''
  const degreeProgrammeType = await getDegreeProgrammeType(code)

  const [students, enrollments, credits] = await Promise.all([
    getStudents(studentNumbers),
    getEnrollments(studentNumbers, mockedStartDate),
    getCredits(studentNumbers, studyRights, mockedStartDate),
  ])

  const optionData = await getOptionsForStudents(studentNumbers, code, degreeProgrammeType)
  const criteria = await getCriteria(code)

  const creditsByStudent: StudentCreditObject = Object.fromEntries(studentNumbers.map(n => [n, []]))
  credits.forEach(credit => {
    const { student_studentnumber: studentnumber } = credit
    creditsByStudent[studentnumber].push(omitKeys(credit, ['student_studentnumber']))
  })

  const enrollmentsByStudent: StudentEnrollmentObject = Object.fromEntries(studentNumbers.map(n => [n, []]))
  enrollments.forEach(enrollment => {
    const { studentnumber } = enrollment
    enrollmentsByStudent[studentnumber].push(omitKeys(enrollment, ['studentnumber']))
  })

  return {
    students: students.map(student =>
      formatStudentForAPI(
        { ...student, tags: tagList[student.studentnumber] },
        enrollmentsByStudent,
        creditsByStudent,
        mockedStartDate,
        criteria,
        code,
        optionData
      )
    ),
  }
}
