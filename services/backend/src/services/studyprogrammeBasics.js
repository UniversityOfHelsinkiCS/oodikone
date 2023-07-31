const { indexOf } = require('lodash')
const {
  getCorrectStudentnumbers,
  getStatsBasis,
  defineYear,
  getYearsArray,
  getStartDate,
  tableTitles,
  alltimeStartDate,
  alltimeEndDate,
} = require('./studyprogrammeHelpers')
const { graduatedStudyRights, startedStudyrights, transfersAway, transfersTo } = require('./studyprogramme')
const { getYearStartAndEndDates } = require('../util/semester')

const getStartedStats = async ({ studyprogramme, years, isAcademicYear }) => {
  const { graphStats, tableStats } = getStatsBasis(years)

  for (const year of years) {
    const { startDate, endDate } = getYearStartAndEndDates(year, isAcademicYear)
    // Include not transferred to, but the transferred out students are fine as said in info box
    const studentnumbersOfTheYear = await getCorrectStudentnumbers({
      codes: [studyprogramme],
      startDate,
      endDate,
      includeAllSpecials: true,
      includeTransferredTo: false,
      includeGraduated: true,
    })
    const studyrights = await startedStudyrights(studyprogramme, startDate, studentnumbersOfTheYear)
    studyrights.forEach(({ studystartdate }) => {
      const startYear = defineYear(studystartdate, isAcademicYear)
      graphStats[indexOf(years, startYear)] += 1
      tableStats[startYear] += 1
    })
  }
  return { graphStats, tableStats }
}

const getGraduatedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)
  if (!studyprogramme) return { graphStats, tableStats }
  const studentnumbersOfTheYear = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
    includeTransferredTo: includeAllSpecials,
  })

  const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbersOfTheYear)
  studyrights.forEach(({ enddate, studyrightElements }) => {
    // Check that the study right element ending to graduation belong to study programme
    const elements = studyrightElements.filter(
      sre => new Date(sre.enddate).toDateString() === new Date(enddate).toDateString()
    )
    if (elements.length) {
      const graduationYear = defineYear(enddate, isAcademicYear)
      graphStats[indexOf(years, graduationYear)] += 1
      tableStats[graduationYear] += 1
    }
  })

  return { graphStats, tableStats }
}

const getTransferredAwayStats = async ({ studyprogramme, since, years, isAcademicYear, combinedProgramme }) => {
  const studyrights = await transfersAway(studyprogramme, since)
  const secondStudyrights = combinedProgramme ? await transfersAway(combinedProgramme, since) : []
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  secondStudyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const getTransferredToStats = async ({ studyprogramme, since, years, isAcademicYear, combinedProgramme }) => {
  const studyrights = await transfersTo(studyprogramme, since)
  const secondStudyrights = combinedProgramme ? await transfersTo(combinedProgramme, since) : []
  const { graphStats, tableStats } = getStatsBasis(years)

  studyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  secondStudyrights.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    graphStats[indexOf(years, transferYear)] += 1
    tableStats[transferYear] += 1
  })

  return { graphStats, tableStats }
}

const initializeGraphStats = (
  includeAllSpecials,
  combinedProgramme,
  started,
  startedSecondProg,
  graduated,
  transferredAway,
  transferredTo,
  graduatedSecondProg
) => {
  let basicTable = []
  if (combinedProgramme) {
    basicTable = [
      {
        name: 'Started bachelor',
        data: started.graphStats,
      },
      {
        name: 'Started licentiate',
        data: startedSecondProg.graphStats,
      },
      {
        name: 'Graduated bachelor',
        data: graduated.graphStats,
      },
      {
        name: 'Graduated licentiate',
        data: graduatedSecondProg.graphStats,
      },
    ]
  } else {
    basicTable = [
      {
        name: 'Started',
        data: started.graphStats,
      },
      {
        name: 'Graduated',
        data: graduated.graphStats,
      },
    ]
  }

  if (includeAllSpecials) {
    basicTable.push({
      name: 'Transferred away',
      data: transferredAway.graphStats,
    })
    basicTable.push({
      name: 'Transferred To',
      data: transferredTo.graphStats,
    })
  }
  return basicTable
}

const initializeTableStats = (
  year,
  combinedProgramme,
  includeAllSpecials,
  started,
  startedSecondProg,
  graduated,
  graduatedSecondProg,
  transferredAway,
  transferredTo
) => {
  if (includeAllSpecials && combinedProgramme) {
    return [
      year,
      started.tableStats[year],
      startedSecondProg.tableStats[year],
      graduated.tableStats[year],
      graduatedSecondProg.tableStats[year],
      transferredAway.tableStats[year],
      transferredTo.tableStats[year],
    ]
  }
  if (combinedProgramme) {
    return [
      year,
      started.tableStats[year],
      startedSecondProg.tableStats[year],
      graduated.tableStats[year],
      graduatedSecondProg.tableStats[year],
    ]
  }
  if (includeAllSpecials) {
    return [
      year,
      started.tableStats[year],
      graduated.tableStats[year],
      transferredAway.tableStats[year],
      transferredTo.tableStats[year],
    ]
  }
  return [year, started.tableStats[year], graduated.tableStats[year]]
}

const getBasicStatsForStudytrack = async ({ studyprogramme, combinedProgramme, settings }) => {
  const { includeAllSpecials, isAcademicYear } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials, combinedProgramme }
  const queryParametersCombinedProg = {
    studyprogramme: combinedProgramme,
    since,
    years,
    isAcademicYear,
    includeAllSpecials,
  }
  const started = await getStartedStats(queryParameters)
  const startedSecondProg = await getStartedStats(queryParametersCombinedProg)
  const graduated = await getGraduatedStats(queryParameters)
  const graduatedSecondProg = await getGraduatedStats(queryParametersCombinedProg)
  const transferredAway = await getTransferredAwayStats(queryParameters)
  const transferredTo = await getTransferredToStats(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()
  const key = includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const titles = tableTitles['basics'][combinedProgramme ? `${key}_COMBINED_PROGRAMME` : key]
  const tableStats = reversedYears.map(year =>
    initializeTableStats(
      year,
      combinedProgramme,
      includeAllSpecials,
      started,
      startedSecondProg,
      graduated,
      graduatedSecondProg,
      transferredAway,
      transferredTo
    )
  )

  return {
    id: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
    years,
    graphStats: initializeGraphStats(
      includeAllSpecials,
      combinedProgramme,
      started,
      startedSecondProg,
      graduated,
      transferredAway,
      transferredTo,
      graduatedSecondProg
    ),
    tableStats,
    titles,
  }
}

module.exports = {
  getGraduatedStats,
  getBasicStatsForStudytrack,
}
