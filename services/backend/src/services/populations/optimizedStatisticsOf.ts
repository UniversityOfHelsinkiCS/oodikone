import { Name } from '../../shared/types'
import { Criteria, DegreeProgrammeType } from '../../types'
import { getDegreeProgrammeType } from '../../util'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { getStudentsIncludeCoursesBetween } from './getStudentsIncludeCoursesBetween'
import { QueryParams, dateMonthsFromNow, formatStudentsForApi, getOptionsForStudents, parseQueryParams } from './shared'
import { getStudentNumbersWithAllStudyRightElements } from './studentNumbersWithAllElements'

export type OptimizedStatisticsQuery = {
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string | string[]
  year: string
  months?: string
}

const hasCorrectStatus = (studentStatuses: string[]) => {
  return studentStatuses.every(status => ['EXCHANGE', 'NONDEGREE', 'TRANSFERRED'].includes(status))
}

export const optimizedStatisticsOf = async (query: OptimizedStatisticsQuery, studentNumberList?: string[]) => {
  if (!query.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  if (query.studentStatuses && !hasCorrectStatus(query.studentStatuses)) {
    return { error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' }
  }

  const {
    studyRights,
    startDate,
    months,
    endDate,
    includeExchangeStudents,
    includeNondegreeStudents,
    includeTransferredStudents: includeTransferredOutStudents,
    tag,
  } = parseQueryParams(query as QueryParams)

  const studentNumbers =
    studentNumberList ??
    (await getStudentNumbersWithAllStudyRightElements({
      studyRights,
      startDate,
      endDate,
      includeExchangeStudents,
      includeNondegreeStudents,
      includeTransferredOutStudents,
    }))

  const code = studyRights[0] || ''
  let optionData = {} as Record<string, { name: Name }>
  let criteria = {} as Criteria

  const degreeProgrammeType = await getDegreeProgrammeType(code)

  if (degreeProgrammeType === DegreeProgrammeType.MASTER || degreeProgrammeType === DegreeProgrammeType.BACHELOR) {
    optionData = await getOptionsForStudents(studentNumbers, code, degreeProgrammeType)
  }
  if (code.includes('KH') || ['MH30_001', 'MH30_003'].includes(code)) {
    criteria = await getCriteria(code)
  }
  const { students, enrollments, credits, courses } = await getStudentsIncludeCoursesBetween(
    studentNumbers,
    startDate,
    dateMonthsFromNow(startDate, months),
    studyRights,
    tag
  )

  const formattedStudents = formatStudentsForApi(
    students,
    enrollments,
    credits,
    courses,
    startDate,
    endDate,
    optionData,
    criteria,
    code
  )

  return formattedStudents
}
