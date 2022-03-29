const { indexOf } = require('lodash')
const {
  getCorrectStudentnumbers,
  getStatsBasis,
  defineYear,
  getYearsArray,
  getStartDate,
  tableTitles,
} = require('./studyprogrammeHelpers')
const { graduatedStudyRights, startedStudyrights, transfersAway, transfersTo } = require('./studyprogramme')
const { getYearStartAndEndDates } = require('../util/semester')

const getStartedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)

  await Promise.all(
    years.map(async year => {
      const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
      const studentnumbersOfTheYear = await getCorrectStudentnumbers({
        codes: [studyprogramme],
        startDate,
        endDate,
        includeAllSpecials,
      })
      const studyrights = await startedStudyrights(studyprogramme, since, studentnumbersOfTheYear)

      studyrights.forEach(({ studystartdate }) => {
        const startYear = defineYear(studystartdate, isAcademicYear)
        graphStats[indexOf(years, startYear)] += 1
        tableStats[startYear] += 1
      })
    })
  )
  return { graphStats, tableStats }
}

const getGraduatedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)

  await Promise.all(
    years.map(async year => {
      const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
      const studentnumbersOfTheYear = await getCorrectStudentnumbers({
        codes: [studyprogramme],
        startDate,
        endDate,
        includeAllSpecials,
      })

      const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbersOfTheYear)
      studyrights.forEach(({ enddate }) => {
        const graduationYear = defineYear(enddate, isAcademicYear)
        graphStats[indexOf(years, graduationYear)] += 1
        tableStats[graduationYear] += 1
      })
    })
  )
  return { graphStats, tableStats }
}

const getTransferredAwayStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const studyrights = await transfersAway(studyprogramme, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async ({ studyprogramme, since, years, isAcademicYear }) => {
  const studyrights = await transfersTo(studyprogramme, since)
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getBasicStatsForStudytrack = async ({ studyprogramme, settings }) => {
  const { includeAllSpecials, isAcademicYear } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const started = await getStartedStats(queryParameters)
  const graduated = await getGraduatedStats(queryParameters)
  const transferredAway = await getTransferredAwayStats(queryParameters)
  const transferredTo = await getTransferredToStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const titles = tableTitles['basics'][includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED']
  const tableStats = reversedYears.map(year =>
    includeAllSpecials
      ? [
          year,
          started.tableStats[year],
          graduated.tableStats[year],
          transferredAway.tableStats[year],
          transferredTo.tableStats[year],
        ]
      : [year, started.tableStats[year], graduated.tableStats[year]]
  )

  return {
    id: studyprogramme,
    years,
    graphStats: includeAllSpecials
      ? [
          {
            name: 'Started',
            data: started.graphStats,
          },
          {
            name: 'Graduated',
            data: graduated.graphStats,
          },
          {
            name: 'Transferred away',
            data: transferredAway.graphStats,
          },
          {
            name: 'Transferred To',
            data: transferredTo.graphStats,
          },
        ]
      : [
          {
            name: 'Started',
            data: started.graphStats,
          },
          {
            name: 'Graduated',
            data: graduated.graphStats,
          },
        ],
    tableStats,
    titles,
  }
}

module.exports = {
  getBasicStatsForStudytrack,
}
