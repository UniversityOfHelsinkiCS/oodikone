const moment = require('moment')
const { indexOf, uniqBy } = require('lodash')

const { mapToProviders } = require('../util/utils')
const {
  getCorrectStudentnumbers,
  getStatsBasis,
  defineYear,
  getYearsObject,
  getYearsArray,
  getMedian,
  getMean,
  getStartDate,
  getThesisType,
} = require('./studyprogrammeHelpers')
const {
  graduatedStudyRights,
  transfersAway,
  transfersTo,
  getThesisCredits,
  followingStudyrights,
} = require('./newStudyprogramme')
const { getYearStartAndEndDates } = require('../util/semester')

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

const getThesisStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const thesisType = getThesisType(studyprogramme)
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

      const credits = await getThesisCredits(providercode, since, thesisType, studentnumbersOfTheYear)

      credits?.forEach(({ attainment_date }) => {
        const attainmentYear = defineYear(attainment_date, isAcademicYear)
        graphStats[indexOf(years, attainmentYear)] += 1
        tableStats[attainmentYear] += 1
      })
    })
  )

  return { graphStats, tableStats }
}

const getGraduationTimeStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  let graduationAmounts = getYearsObject(years)
  let graduationTimes = getYearsObject(years, true)

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

      studyrights.forEach(({ enddate, studystartdate }) => {
        const graduationYear = defineYear(enddate, isAcademicYear)
        const timeToGraduation = moment(enddate).diff(moment(studystartdate), 'months')
        graduationAmounts[graduationYear] += 1
        graduationTimes[graduationYear] = [...graduationTimes[graduationYear], timeToGraduation]
      })
    })
  )
  // The maximum amount of months in the graph depends on the studyprogramme intended graduation time
  const comparisonValue = studyprogramme.includes('KH') ? 72 : 48

  const medians = getYearsObject(years, true)
  const means = getYearsObject(years, true)

  // HighCharts graph require the data to have this format (ie. actual value, "empty value")
  years.forEach(year => {
    const median = getMedian(graduationTimes[year])
    const mean = getMean(graduationTimes[year])
    medians[year] = [
      ['', median],
      ['', comparisonValue - median],
    ]
    means[year] = [
      ['', mean],
      ['', comparisonValue - mean],
    ]
  })
  return { medians, means, graduationAmounts }
}

const getProgrammesAfterGraduation = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const graduated = await graduatedStudyRights(studyprogramme, since)
  const graduatedStudents = graduated.map(s => s.studentnumber)
  let studyrightsAfterThisProgramme = await followingStudyrights(since, graduatedStudents)
  const studyprogrammeCodes = uniqBy(studyrightsAfterThisProgramme, 'code').map(s => ({ code: s.code, name: s.name }))

  const stats = {}
  studyprogrammeCodes.forEach(c => (stats[c.code] = { ...c, ...getYearsObject(years) }))

  if (!includeAllSpecials) {
    const transferredAway = await transfersAway(studyprogramme, since)
    const transferredTo = await transfersTo(studyprogramme, since)
    const transfers = [...transferredAway, ...transferredTo].map(s => s.studyrightid)
    studyrightsAfterThisProgramme.filter(s => !transfers.includes(s.studyrightid) && !s.canceldate)
  }

  studyrightsAfterThisProgramme.forEach(({ studystartdate, code }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    if (years.includes(startYear) && code) {
      stats[code][startYear] += 1
    }
  })

  const tableStats = Object.values(stats)
    .map(p => [p.code, p.name['fi'], ...years.map(year => p[year])])
    .filter(p => p[0].includes('MH'))

  const graphStats = Object.values(stats)
    .map(p => ({ name: p.name['fi'], code: p.code, data: years.map(year => p[year]) }))
    .filter(p => p.code.includes('MH'))

  return { tableStats, graphStats }
}

const getGraduationStatsForStudytrack = async ({ studyprogramme, yearType, specialGroups }) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const thesis = await getThesisStats(queryParameters)
  const graduated = await getGraduatedStats(queryParameters)
  const graduationTimeStats = await getGraduationTimeStats(queryParameters)
  const programmesAfterGraduation = await getProgrammesAfterGraduation(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles = ['', 'Graduated', 'Wrote thesis']
  const programmesAfterTitles = ['Code', 'Programme', ...years]
  const tableStats = reversedYears.map(year => [year, graduated.tableStats[year], thesis.tableStats[year]])

  return {
    id: studyprogramme,
    years,
    tableStats,
    titles,
    graphStats: [
      {
        name: 'Graduated students',
        data: graduated.graphStats,
      },
      {
        name: 'Wrote thesis',
        data: thesis.graphStats,
      },
    ],
    graduationMedianTime: graduationTimeStats.medians,
    graduationMeanTime: graduationTimeStats.means,
    graduationAmounts: graduationTimeStats.graduationAmounts,
    programmesAfterTableStats: programmesAfterGraduation.tableStats,
    programmesAfterGraphStats: programmesAfterGraduation.graphStats,
    programmesAfterTitles,
  }
}

module.exports = {
  getGraduationStatsForStudytrack,
}
