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
import { getOptionsForStudents, parseCourseData } from './shared'

export type OptimizedStatisticsQuery = {
  userId: string
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string | string[]
  years: string[]
}

export type AnonymousEnrollment = Omit<StudentEnrollment, 'studentnumber'>
export type AnonymousCredit = Omit<StudentCredit, 'student_studentnumber'>

export type StudentEnrollmentObject = Map<StudentEnrollment['studentnumber'], AnonymousEnrollment[]>
export type StudentCreditObject = Map<StudentCredit['student_studentnumber'], AnonymousCredit[]>

export const optimizedStatisticsOf = async (
  studentNumbers: string[],
  studyRights: string[],
  tagList: Record<string, StudentTags[]>,
  startDate?: string
) => {
  const code = studyRights[0] ?? ''
  const mockedStartDate = startDate ?? new Date(1900).toISOString()

  const [students, enrollments, credits] = await Promise.all([
    getStudents(studentNumbers),
    getEnrollments(studentNumbers, mockedStartDate),
    getCredits(studentNumbers, studyRights, mockedStartDate),
  ])

  const formattedCoursestats = parseCourseData(code, mockedStartDate, students, enrollments, credits)

  const creditsByStudent: StudentCreditObject = new Map<string, AnonymousCredit[]>(studentNumbers.map(n => [n, []]))
  const enrollmentsByStudent: StudentEnrollmentObject = new Map<string, AnonymousEnrollment[]>(
    studentNumbers.map(n => [n, []])
  )

  credits.forEach(credit =>
    creditsByStudent.get(credit.student_studentnumber)?.push(omitKeys(credit, ['student_studentnumber']))
  )
  enrollments.forEach(enrollment =>
    enrollmentsByStudent.get(enrollment.studentnumber)?.push(omitKeys(enrollment, ['studentnumber']))
  )

  const criteria = await getCriteria(code)
  const optionData = await getOptionsForStudents(studentNumbers, code, await getDegreeProgrammeType(code))

  return {
    coursestatistics: formattedCoursestats,
    students: students.map(student =>
      formatStudentForAPI(
        { ...student, tags: tagList[student.studentnumber] },
        enrollmentsByStudent.get(student.studentnumber) ?? [],
        creditsByStudent.get(student.studentnumber) ?? [],
        mockedStartDate,
        criteria,
        code,
        optionData
      )
    ),
  }
}
