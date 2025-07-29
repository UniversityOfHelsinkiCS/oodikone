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

export const statisticsOf = async (
  studentNumbers: string[],
  studyRights: string[],
  tagList: Record<string, StudentTags[]>,
  startDate?: string
) => {
  const code = studyRights[0] ?? ''
  const mockedStartDate = startDate ?? new Date(1900).toISOString()

  const [enrollments, credits, students] = await Promise.all([
    getEnrollments(studentNumbers, mockedStartDate),
    getCredits(studentNumbers, studyRights, mockedStartDate),
    getStudents(studentNumbers),
  ])

  const studentStartingYears = new Map(
    students.map(({ studentnumber, studyRights }) => [
      studentnumber,
      studyRights
        ?.flatMap(({ studyRightElements }) => studyRightElements)
        .find(element => element.code === code)
        ?.startDate.getFullYear() ?? +mockedStartDate,
    ])
  )

  const formattedCoursestats = await parseCourseData(studentStartingYears, enrollments, credits)

  const creditsByStudent: StudentCreditObject = new Map<string, AnonymousCredit[]>(studentNumbers.map(n => [n, []]))
  credits.forEach(credit =>
    creditsByStudent.get(credit.student_studentnumber)!.push(omitKeys(credit, ['student_studentnumber']))
  )

  const enrollmentsByStudent: StudentEnrollmentObject = new Map<string, AnonymousEnrollment[]>(
    studentNumbers.map(n => [n, []])
  )
  enrollments.forEach(enrollment => {
    const { studentnumber } = enrollment
    enrollmentsByStudent[studentnumber].push(omitKeys(enrollment, ['studentnumber']))
  })

  const criteria = await getCriteria(code)
  const optionData = await getOptionsForStudents(studentNumbers, code, await getDegreeProgrammeType(code))

  return {
    coursestatistics: formattedCoursestats,
    students: students.map(student =>
      formatStudentForAPI(
        code,
        mockedStartDate,
        { ...student, tags: tagList[student.studentnumber] },
        creditsByStudent.get(student.studentnumber) ?? [],
        enrollmentsByStudent.get(student.studentnumber) ?? [],
        optionData?.[student.studentnumber],
        criteria
      )
    ),
  }
}
