import { formatToArray } from '../../shared/util'
import { getDegreeProgrammeType } from '../../util'
import { dateMonthsFromNow } from '../../util/datetime'
import { SemesterStart } from '../../util/semester'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { formatStudentsForApi } from './formatStatisticsForApi'
import {
  getStudents,
  getStudentTags,
  creditFilterBuilder,
  getCourses,
  getEnrollments,
  getCredits,
} from './getStudentData'
import { getOptionsForStudents } from './shared'
import { getStudentNumbersWithAllStudyRightElements } from './studentNumbersWithAllElements'

export type OptimizedStatisticsQuery = {
  userId: string
  semesters: string[]
  studentStatuses?: string[]
  studyRights?: string | string[]
  year: string
  months?: string
}

export type ParsedQueryParams = {
  startDate: string
  endDate: string
  includeExchangeStudents: boolean
  includeNondegreeStudents: boolean
  includeTransferredStudents: boolean
  studyRights: string[]
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
    studyRights: formatToArray(studyRights).filter(Boolean) as string[],
    months,
    startDate,
    endDate,
  }
}

export const optimizedStatisticsOf = async (query: OptimizedStatisticsQuery, studentNumberList?: string[]) => {
  const { userId } = query
  const {
    studyRights,
    startDate,
    months,
    endDate,
    includeExchangeStudents,
    includeNondegreeStudents,
    includeTransferredStudents: includeTransferredOutStudents,
  } = parseQueryParams(query)

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

  const creditsFilter = await creditFilterBuilder(
    studentNumbers,
    studyRights,
    startDate,
    dateMonthsFromNow(startDate, months)
  )
  const [students, courses, enrollments, credits] = await Promise.all([
    getStudents(studentNumbers),
    getCourses(creditsFilter),
    getEnrollments(studentNumbers, startDate, dateMonthsFromNow(startDate, months)),
    getCredits(creditsFilter),
  ])

  const tagList = await getStudentTags(studyRights, studentNumbers, userId)

  const optionData = await getOptionsForStudents(studentNumbers, code, degreeProgrammeType)
  const criteria = await getCriteria(code)

  const formattedStudents = formatStudentsForApi(
    students.map(student => ({ ...student, tags: tagList[student.studentnumber] })),
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
