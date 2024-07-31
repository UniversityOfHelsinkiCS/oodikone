import moment from 'moment'

import { Criteria, Name } from '../../types'
import { getCriteria } from '../studyProgramme/studyProgrammeCriteria'
import { getStudentsIncludeCoursesBetween } from './getStudentsIncludeCoursesBetween'
import {
  dateMonthsFromNow,
  formatQueryParamsToArrays,
  formatStudentsForApi,
  getOptionsForStudents,
  parseQueryParams,
} from './shared'
import { studentnumbersWithAllStudyrightElements } from './studentnumbersWithAllStudyrightElements'

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
    parseQueryParams(formattedQueryParams)

  // db startdate is formatted to utc so need to change it when querying
  const formattedStartDate = new Date(moment.tz(startDate, 'Europe/Helsinki').format()).toUTCString()

  const studentNumbers =
    studentNumberList ||
    (await studentnumbersWithAllStudyrightElements({
      studyRights,
      startDate: formattedStartDate,
      endDate,
      exchangeStudents,
      nondegreeStudents,
      transferredOutStudents: transferredStudents,
      tag: null,
      transferredToStudents: true,
      graduatedStudents: true,
    }))

  const code = studyRights[0] || ''
  let optionData = {} as Record<string, { code: string; name: Name }>
  let criteria = {} as Criteria
  if (code.includes('MH')) {
    optionData = await getOptionsForStudents(studentNumbers, code, 'MSC')
  } else if (code.includes('KH')) {
    optionData = await getOptionsForStudents(studentNumbers, code, 'BSC')
  }
  if (code.includes('KH') || ['MH30_001', 'MH30_003'].includes(code)) {
    criteria = await getCriteria(code)
  }
  const { students, enrollments, credits, extents, semesters, elementdetails, courses } =
    await getStudentsIncludeCoursesBetween(
      studentNumbers,
      startDate,
      dateMonthsFromNow(startDate, months),
      studyRights,
      tag
    )

  const formattedStudents = await formatStudentsForApi(
    { students, enrollments, credits, extents, semesters, elementdetails, courses },
    startDate,
    endDate,
    studyRights,
    optionData,
    criteria,
    code
  )

  return formattedStudents
}
