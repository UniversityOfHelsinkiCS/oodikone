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
import { getCourses, getOptionsForStudents } from './shared'

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
  tagMap: Map<string, StudentTags[]>,
  startDate?: string
) => {
  const code = studyRights[0] ?? ''
  const mockedStartDate = startDate ?? new Date(1900, 0, 1).toISOString()

  const [students, enrollments, credits, degreeProgrammeType, criteria, studyRightElementsForStudyRight] =
    await Promise.all([
      getStudents(studentNumbers),
      getEnrollments(studentNumbers, mockedStartDate),
      getCredits(studentNumbers),
      getDegreeProgrammeType(code),
      getCriteria(code),
      getStudyRightElementsForStudyRight(studentNumbers, code),
    ])

  const courseCodes = new Set<string>()
  for (const { course_code } of credits) courseCodes.add(course_code)
  for (const { course_code } of enrollments) courseCodes.add(course_code)
  const courses = await getCourses(Array.from(courseCodes))

  const optionData = getOptionsForStudents(studyRightElementsForStudyRight, degreeProgrammeType)
  const formattedStudents = students.map(student => {
    const tags = tagMap.get(student.studentnumber) ?? []
    const options = optionData.get(student.studentnumber)

    return formatStudentForAPI(code, mockedStartDate, student, tags, options)
  })

  return {
    students: formattedStudents,
    criteria,
    coursestatistics: { courses, enrollments, credits },
  }
}
