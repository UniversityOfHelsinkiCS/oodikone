import { getDegreeProgrammeType } from '../../util'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { formatStudentForAPI } from './formatStatisticsForApi'
import {
  type StudentEnrollment,
  type StudentCredit,
  type StudentTags,
  getStudents,
  getEnrollments,
  getCredits,
  getStudyRightElementsForStudyRight,
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

  const t0 = performance.now()
  const [students, enrollments, credits, degreeProgrammeType, criteria, studyRightElementsForStudyRight] =
    await Promise.all([
      getStudents(studentNumbers),
      getEnrollments(studentNumbers, mockedStartDate),
      getCredits(studentNumbers),
      getDegreeProgrammeType(code),
      getCriteria(code),
      getStudyRightElementsForStudyRight(studentNumbers, code),
    ])

  const t1 = performance.now()
  console.log('DB calls for students, credits, enrollments duration: ', t1 - t0, 'ms') // eslint-disable-line no-console

  const t2 = performance.now()

  const studentStartingYears = new Map(
    students.map(({ studentnumber, studyRights }) => [
      studentnumber,
      studyRights
        ?.flatMap(({ studyRightElements }) => studyRightElements)
        .find(element => element.code === code)
        ?.startDate.getFullYear() ?? +mockedStartDate,
    ])
  )

  const creditsAndEnrollmentsByStudent = new Map<string, [AnonymousCredit[], AnonymousEnrollment[]]>(
    studentNumbers.map(n => [n, [[], []]])
  )

  for (const credit of credits) {
    const { student_studentnumber, ...rest } = credit
    creditsAndEnrollmentsByStudent.get(student_studentnumber)![0].push(rest)
  }

  for (const enrollment of enrollments) {
    const { studentnumber, ...rest } = enrollment
    creditsAndEnrollmentsByStudent.get(studentnumber)![1].push(rest)
  }

  const formattedCoursestats = await parseCourseData(studentStartingYears, enrollments, credits)
  const optionData = getOptionsForStudents(studyRightElementsForStudyRight, degreeProgrammeType)

  const t3 = performance.now()
  console.log('Rest of statisticsOf: ', t3 - t2, 'ms') // eslint-disable-line no-console
  return {
    coursestatistics: formattedCoursestats,
    students: students.map(student => {
      const [credits, enrollments] = creditsAndEnrollmentsByStudent.get(student.studentnumber)!

      return formatStudentForAPI(
        code,
        mockedStartDate,
        student,
        tagList[student.studentnumber],
        credits,
        enrollments,
        optionData[student.studentnumber],
        criteria
      )
    }),
  }
}
