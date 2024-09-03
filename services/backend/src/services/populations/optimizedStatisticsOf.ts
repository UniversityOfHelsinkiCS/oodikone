import { Criteria, DegreeProgrammeType, Name } from '../../types'
import { getDegreeProgrammeType } from '../../util'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { getStudentsIncludeCoursesBetween } from './getStudentsIncludeCoursesBetween'
import {
  dateMonthsFromNow,
  formatQueryParamsToArrays,
  formatStudentsForApi,
  getOptionsForStudents,
  parseQueryParams,
  Query as FormattedQueryParams,
} from './shared'
import { getStudentNumbersWithAllStudyRightElements } from './studentNumbersWithAllElements'

type Query = {
  year?: number
  studyRights?: string[] | { programme: string }
  semesters?: string[]
  months?: number
}

const hasCorrectStatus = (studentStatuses: string[]) => {
  return studentStatuses.every(status => ['EXCHANGE', 'NONDEGREE', 'TRANSFERRED'].includes(status))
}

export const optimizedStatisticsOf = async (query: Query, studentNumberList?: string[]) => {
  const formattedQueryParams = formatQueryParamsToArrays(query, ['semesters', 'studentStatuses'])

  if (!formattedQueryParams.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  if (formattedQueryParams.studentStatuses && !hasCorrectStatus(formattedQueryParams.studentStatuses)) {
    return { error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' }
  }

  const { studyRights, startDate, months, endDate, exchangeStudents, nondegreeStudents, transferredStudents, tag } =
    parseQueryParams(formattedQueryParams as FormattedQueryParams)

  const studentNumbers =
    studentNumberList ||
    (await getStudentNumbersWithAllStudyRightElements({
      studyRights,
      startDate,
      endDate,
      exchangeStudents,
      nondegreeStudents,
      transferredOutStudents: transferredStudents,
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

  const formattedStudents = await formatStudentsForApi(
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
