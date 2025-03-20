import { getDegreeProgrammeType } from '../../util'
import { dateMonthsFromNow } from '../../util/datetime'
import { SemesterStart } from '../../util/semester'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { formatStudentsForApi } from './formatStatisticsForApi'
import { getStudentsIncludeCoursesBetween } from './getStudentsIncludeCoursesBetween'
import { getOptionsForStudents } from './shared'
import { getStudentNumbersWithAllStudyRightElements } from './studentNumbersWithAllElements'

type OptimizedStatisticsQuery = {
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string
  year: string
  months?: string
}

type ParsedQueryParams = {
  startDate: string
  endDate: string
  includeExchangeStudents: boolean
  includeNondegreeStudents: boolean
  includeTransferredStudents: boolean
  studyRights?: string
  months?: string
}

const parseQueryParams = (query: OptimizedStatisticsQuery): ParsedQueryParams => {
  const { semesters, studentStatuses, studyRights, months, year } = query
  const yearAsNumber = +year

  const hasFall = semesters.includes('FALL')
  const hasSpring = semesters.includes('SPRING')

  const startDate = hasFall
    ? new Date(`${yearAsNumber}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${yearAsNumber + 1}-${SemesterStart.SPRING}`).toISOString()

  const endDate = hasSpring
    ? new Date(`${yearAsNumber + 1}-${SemesterStart.FALL}`).toISOString()
    : new Date(`${yearAsNumber + 1}-${SemesterStart.SPRING}`).toISOString()

  const includeExchangeStudents = !!studentStatuses?.includes('EXCHANGE')
  const includeNondegreeStudents = !!studentStatuses?.includes('NONDEGREE')
  const includeTransferredStudents = !!studentStatuses?.includes('TRANSFERRED')

  return {
    includeExchangeStudents,
    includeNondegreeStudents,
    includeTransferredStudents,
    // Remove falsy values so the query doesn't break
    studyRights,
    months,
    startDate,
    endDate,
  }
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
  } = parseQueryParams(query)

  const code = studyRights ?? ''

  const studentNumbers =
    studentNumberList ??
    (await getStudentNumbersWithAllStudyRightElements(
      code,
      startDate,
      endDate,
      includeExchangeStudents,
      includeNondegreeStudents,
      includeTransferredOutStudents
    ))

  const degreeProgrammeType = await getDegreeProgrammeType(code)

  const { courses, enrollments, credits, students } = await getStudentsIncludeCoursesBetween(
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
