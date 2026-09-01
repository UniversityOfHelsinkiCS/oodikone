import { getDegreeProgrammeType } from '../../util'
import { now } from '../../util/clock'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { getCourseDetails } from '../courses'
import { formatStudentForAPI } from './formatStatisticsForApi'
import {
  type StudentTags,
  getStudents,
  getEnrollments,
  getCredits,
  getStudyRightElementsForStudyRight,
} from './getStudentData'
import { getCourseGroupIds, getOptionsForStudents } from './shared'
import { StudentCredit, StudentEnrollment } from '@oodikone/shared/types/studentData'

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
  filterByDates: boolean,
  startDate?: string,
  endDate?: string
) => {
  const defaultStartDate = new Date(1900, 0, 1).toISOString()
  const defaultEndDate = new Date(now().getFullYear() + 1, 0, 1).toISOString()

  const code = studyRights[0] ?? ''
  const mockedStartDate = startDate ?? defaultStartDate
  const mockedEndDate = endDate ?? defaultEndDate

  const [students, enrollments, credits, degreeProgrammeType, criteria, studyRightElementsForStudyRight] =
    await Promise.all([
      getStudents(studentNumbers),

      // NOTE: If filterByDates is set, use default values for filtering credits and enrollments
      getEnrollments(
        studentNumbers,
        filterByDates ? mockedStartDate : defaultStartDate,
        filterByDates ? mockedEndDate : defaultEndDate
      ),
      getCredits(
        studentNumbers,
        filterByDates ? mockedStartDate : defaultStartDate,
        filterByDates ? mockedEndDate : defaultEndDate
      ),

      getDegreeProgrammeType(code),
      getCriteria(code),
      getStudyRightElementsForStudyRight(studentNumbers, code),
    ])

  const courseIds = new Set<string>()
  for (const { course_id } of credits) courseIds.add(course_id)
  for (const { course_id } of enrollments) courseIds.add(course_id)
  const idToGroupIdRows = await getCourseGroupIds([...courseIds])
  const idToGroupIdMap = Object.fromEntries(idToGroupIdRows.map(({ id, groupId }) => [id, groupId]))
  const groupIds = [...new Set(idToGroupIdRows.map(({ groupId }) => groupId))]
  const courses = await getCourseDetails(groupIds)

  const optionData = getOptionsForStudents(studyRightElementsForStudyRight, degreeProgrammeType)
  const formattedStudents = students.map(student => {
    const tags = tagMap.get(student.studentnumber) ?? []
    const options = optionData.get(student.studentnumber)

    return formatStudentForAPI(code, mockedStartDate, student, tags, options)
  })

  return {
    students: formattedStudents,
    criteria,
    coursestatistics: { courses, idToGroupIdMap, enrollments, credits },
  }
}
