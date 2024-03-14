const { getCriteria } = require('../studyprogramme/studyProgrammeCriteria')
const { getStudentsIncludeCoursesBetween } = require('./getStudentsIncludeCoursesBetween')
const {
  parseQueryParams,
  formatQueryParamArrays,
  getOptionsForStudents,
  dateMonthsFromNow,
  formatStudentsForApi,
} = require('./shared')
const { studentnumbersWithAllStudyrightElements } = require('./studentnumbersWithAllStudyrightElements')
const moment = require('moment')

const optimizedStatisticsOf = async (query, studentnumberlist) => {
  const formattedQueryParams = formatQueryParamArrays(query, ['semesters', 'studentStatuses'])

  if (!formattedQueryParams.semesters.every(semester => semester === 'FALL' || semester === 'SPRING')) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  if (
    formattedQueryParams.studentStatuses &&
    !formattedQueryParams.studentStatuses.every(
      status => status === 'EXCHANGE' || status === 'NONDEGREE' || status === 'TRANSFERRED'
    )
  ) {
    return { error: 'Student status should be either EXCHANGE or NONDEGREE or TRANSFERRED' }
  }
  const { studyRights, startDate, months, endDate, exchangeStudents, nondegreeStudents, transferredStudents, tag } =
    parseQueryParams(formattedQueryParams)

  // db startdate is formatted to utc so need to change it when querying
  const formattedStartDate = new Date(moment.tz(startDate, 'Europe/Helsinki').format()).toUTCString()

  const studentnumbers =
    studentnumberlist ||
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
  let optionData = {}
  let criteria = {}
  if (code.includes('MH')) {
    optionData = await getOptionsForStudents(studentnumbers, code, 'MSC')
  } else if (code.includes('KH')) {
    optionData = await getOptionsForStudents(studentnumbers, code, 'BSC')
  }
  if (code.includes('KH') || ['MH30_001', 'MH30_003'].includes(code)) {
    criteria = await getCriteria(code)
  }
  const { students, enrollments, credits, extents, semesters, elementdetails, courses } =
    await getStudentsIncludeCoursesBetween(
      studentnumbers,
      startDate,
      dateMonthsFromNow(startDate, months),
      studyRights,
      tag
    )

  const formattedStudents = await formatStudentsForApi(
    { students, enrollments, credits, extents, semesters, elementdetails, courses },
    startDate,
    endDate,
    formattedQueryParams,
    optionData,
    criteria,
    code
  )

  return formattedStudents
}

module.exports = {
  optimizedStatisticsOf,
}
