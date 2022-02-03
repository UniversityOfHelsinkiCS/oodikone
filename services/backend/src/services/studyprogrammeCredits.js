const { indexOf } = require('lodash')

const { mapToProviders } = require('../util/utils')
const {
  getStatsBasis,
  defineYear,
  isMajorStudentCredit,
  getYearsArray,
  getStartDate,
  isSpecialGroupCredit,
} = require('./studyprogrammeHelpers')
const {
  getProgrammesStudents,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  transfersAway,
  transfersTo,
} = require('./newStudyprogramme')

const getRegularCreditStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const studyrights = await getProgrammesStudents(studyprogramme)

  let transfers = []
  if (!includeAllSpecials) {
    const transferredAway = await transfersAway(studyprogramme, since)
    const transferredTo = await transfersTo(studyprogramme, since)
    transfers = [...transferredAway, ...transferredTo].map(s => s.studyrightid)
  }
  const credits = await getCreditsForStudyProgramme(providercode, since)

  let majors = getStatsBasis(years)
  let nonMajors = getStatsBasis(years)

  credits.forEach(({ student_studentnumber, attainment_date, credits }) => {
    const studyright = studyrights.find(studyright => studyright.studentnumber == student_studentnumber)
    const attainmentYear = defineYear(attainment_date, isAcademicYear)

    if (!includeAllSpecials && isSpecialGroupCredit(studyright, attainment_date, transfers)) {
      return
    }

    if (isMajorStudentCredit(studyright, attainment_date)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else {
      nonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonMajors.tableStats[attainmentYear] += credits || 0
    }
  })

  return { majors, nonMajors }
}

const getTransferredCreditStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const credits = await getTransferredCredits(providercode, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += credits || 0
    tableStats[attainmentYear] += credits || 0
  })

  return { graphStats, tableStats }
}

const getCreditStatsForStudytrack = async ({ studyprogramme, yearType, specialGroups }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const { majors, nonMajors } = await getRegularCreditStats(queryParameters)
  const transferred = await getTransferredCreditStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles = includeAllSpecials
    ? ['', 'Total', 'Major students credits', 'Non major students credits', 'Transferred credits']
    : ['', 'Total', 'Major students credits', 'Transferred credits']

  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          majors.tableStats[year] + nonMajors.tableStats[year] + transferred.tableStats[year],
          majors.tableStats[year],
          nonMajors.tableStats[year],
          transferred.tableStats[year],
        ]
      : [
          year,
          majors.tableStats[year] + nonMajors.tableStats[year] + transferred.tableStats[year],
          majors.tableStats[year],
          transferred.tableStats[year],
        ]
  )

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats: [
      {
        name: 'Major students credits',
        data: majors.graphStats,
      },
      {
        name: 'Non-major students credits',
        data: nonMajors.graphStats,
      },
      {
        name: 'Transferred credits',
        data: transferred.graphStats,
      },
    ],
    titles,
  }
}

module.exports = {
  getCreditStatsForStudytrack,
}
