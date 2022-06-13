const { indexOf } = require('lodash')

const { mapToProviders } = require('../util/utils')
const {
  getStatsBasis,
  defineYear,
  isMajorStudentCredit,
  getYearsArray,
  getStartDate,
  isSpecialGroupCredit,
  tableTitles,
} = require('./studyprogrammeHelpers')
const {
  getProgrammesStudyrights,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  allTransfers,
} = require('./studyprogramme')

// Fetches all the credits for the studyprogramme and divides them into major-students and non-major students credits
// Division is done on the basis that whether the student had a primary studyright to the programme on the attainment_date
// If special groups are excluded, the transfer students are filtered away from the major-students as well
const getRegularCreditStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  let studyrights = await getProgrammesStudyrights(studyprogramme, since)
  const transfers = (await allTransfers(studyprogramme, since)).map(t => t.studyrightid)

  if (!includeAllSpecials) {
    studyrights.filter(s => !transfers.includes(s.studyrightid))
  }

  const credits = await getCreditsForStudyProgramme(providercode, since)

  let majors = getStatsBasis(years)
  let nonMajors = getStatsBasis(years)
  let nonDegree = getStatsBasis(years)

  credits.forEach(({ student_studentnumber, attainment_date, credits }) => {
    const studyright = studyrights.find(studyright => studyright.studentnumber == student_studentnumber)
    const attainmentYear = defineYear(attainment_date, isAcademicYear)

    if (!includeAllSpecials && isSpecialGroupCredit(studyright, attainment_date, transfers)) {
      return
    }

    if (isMajorStudentCredit(studyright, attainment_date)) {
      majors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      majors.tableStats[attainmentYear] += credits || 0
    } else if (!studyright) {
      nonDegree.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonDegree.tableStats[attainmentYear] += credits || 0
    } else {
      nonMajors.graphStats[indexOf(years, attainmentYear)] += credits || 0
      nonMajors.tableStats[attainmentYear] += credits || 0
    }
  })

  if (
    majors.graphStats.every(year => year === 0) &&
    nonMajors.graphStats.every(year => year === 0) &&
    nonDegree.graphStats.every(year => year === 0)
  ) {
    return {
      majors: { graphStats: [], tableStats: {} },
      nonMajors: { graphStats: [], tableStats: {} },
      nonDegree: { graphStats: [], tablestats: {} },
    }
  }

  return { majors, nonMajors, nonDegree }
}

// Fetches all the credits with the type "transferred / hyväksiluettu" and divides them by year
const getTransferredCreditStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const credits = await getTransferredCredits(providercode, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  credits.forEach(({ attainment_date, credits }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += credits || 0
    tableStats[attainmentYear] += credits || 0
  })

  if (graphStats.every(year => year === 0)) {
    return { graphStats: [], tableStats: {} }
  }

  return { graphStats, tableStats }
}

// Fetches all credits for the studytrack and combines them into the statistics for the table
// and graph in the studyprogramme overview
const getCreditStatsForStudytrack = async ({ studyprogramme, settings }) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const { majors, nonMajors, nonDegree } = await getRegularCreditStats(queryParameters)
  const transferred = await getTransferredCreditStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const titles = tableTitles['credits'][includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED']
  const dataFound = [majors, nonMajors, transferred].some(d => d.graphStats.length)

  if (!dataFound) return null

  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          majors.tableStats[year] +
            nonMajors.tableStats[year] +
            transferred.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
          nonMajors.tableStats[year],
          nonDegree.tableStats[year],
          transferred.tableStats[year],
        ]
      : [
          year,
          majors.tableStats[year] +
            nonMajors.tableStats[year] +
            transferred.tableStats[year] +
            nonDegree.tableStats[year],
          majors.tableStats[year],
          transferred.tableStats[year],
        ]
  )

  const graphStats = [
    {
      name: 'Major students credits',
      data: majors.graphStats,
    },
    {
      name: 'Non-major students credits',
      data: nonMajors.graphStats,
    },
    {
      name: 'Non-degree credits',
      data: nonDegree.graphStats,
    },
    {
      name: 'Transferred credits',
      data: transferred.graphStats,
    },
  ]

  return {
    id: studyprogramme,
    years,
    tableStats,
    graphStats,
    titles,
  }
}

module.exports = {
  getCreditStatsForStudytrack,
}
