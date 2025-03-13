import { getDegreeProgrammeType } from '../../util'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { getStudentsIncludeCoursesBetween } from './getStudentsIncludeCoursesBetween'
import {
  type QueryParams,
  dateMonthsFromNow,
  formatStudentsForApi,
  getOptionsForStudents,
  parseQueryParams,
} from './shared'
import { getStudentNumbersWithAllStudyRightElements } from './studentNumbersWithAllElements'

export type OptimizedStatisticsQuery = {
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string | string[]
  year: string
  months?: string
}

export const optimizedStatisticsOf = async (query: OptimizedStatisticsQuery, studentNumberList?: string[]) => {
  const {
    studyRights,
    startDate,
    months,
    endDate,
    includeExchangeStudents,
    includeNondegreeStudents,
    includeTransferredStudents: includeTransferredOutStudents,
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

  const code = studyRights[0] ?? ''
  const degreeProgrammeType = await getDegreeProgrammeType(code)

  const { students, enrollments, credits, courses } = await getStudentsIncludeCoursesBetween(
    studentNumbers,
    startDate,
    dateMonthsFromNow(startDate, months),
    studyRights
  )

  const optionData = await getOptionsForStudents(studentNumbers, code, degreeProgrammeType ?? undefined)
  const criteria = await getCriteria(code)

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
