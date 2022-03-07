const moment = require('moment')
const { indexOf, uniqBy } = require('lodash')

const { mapToProviders } = require('../util/utils')
const {
  getCorrectStudentnumbers,
  getStatsBasis,
  defineYear,
  getYearsObject,
  getAcademicYearsObject,
  getYearsArray,
  getMedian,
  getMean,
  getStartDate,
  getThesisType,
} = require('./studyprogrammeHelpers')
const {
  graduatedStudyRights,
  getThesisCredits,
  followingStudyrights,
  previousStudyrights,
  allStudyrights,
  allTransfers,
} = require('./studyprogramme')
const { getYearStartAndEndDates } = require('../util/semester')
const { getAllProgrammes } = require('./studyrights')

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
  let graduationAmounts = getYearsObject({ years })
  let graduationTimes = getYearsObject({ years, emptyArrays: true })
  let totalAmounts = isAcademicYear ? getAcademicYearsObject({ years }) : getYearsObject({ years })

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
      totalAmounts[year] = studentnumbersOfTheYear.length

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

  const medians = getYearsObject({ years, emptyArrays: true })
  const means = getYearsObject({ years, emptyArrays: true })

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
  return { medians, means, graduationAmounts, totalAmounts }
}

// Creates (studyrightid, transfer)-map out of programmes transfers
const getTransferStudyrightMap = async (studyprogramme, since) => {
  const transfers = await allTransfers(studyprogramme, since)
  const studyrightTransferMap = new Map()
  transfers.forEach(t => studyrightTransferMap.set(t.studyrightid, t))
  return studyrightTransferMap
}

const formatStats = (stats, years) => {
  const tableStats = Object.values(stats)
    .filter(p => years.map(year => p[year]).find(started => started !== 0)) // Filter out programmes with no-one started between the selected years
    .map(p => [p.code, p.name['fi'], ...years.map(year => p[year])])

  const graphStats = Object.values(stats)
    .filter(p => years.map(year => p[year]).find(started => started !== 0)) // Filter out programmes with no-one started between the selected years
    .map(p => ({ name: p.name['fi'], code: p.code, data: years.map(year => p[year]) }))

  return { tableStats, graphStats }
}

const getProgrammesBeforeStarting = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const all = await allStudyrights(studyprogramme)
  const allStudents = all.map(s => s.studentnumber)

  // Get studyrights for bachelor studyprogrammes. This excludes studytracks.
  const programmes = await getAllProgrammes()
  let studyrightsBeforeMasters = await previousStudyrights(since, programmes, allStudents)
  const studyprogrammeCodes = uniqBy(studyrightsBeforeMasters, 'code').map(s => ({ code: s.code, name: s.name }))
  const stats = {}
  studyprogrammeCodes.forEach(c => (stats[c.code] = { ...c, ...getYearsObject({ years }) }))

  // Map transfers to the Master's programme
  const transfers = await getTransferStudyrightMap(studyprogramme, since)

  studyrightsBeforeMasters.forEach(({ studentnumber, code, givendate }) => {
    const masterStudyright = all.find(s => s.studentnumber === studentnumber)
    const transfer = transfers.get(masterStudyright.studyrightid)

    // If special studyrights are excluded, transfers to the master's programme should be excluded
    if (!includeAllSpecials && transfers.get(masterStudyright.studyrightid)) {
      return
    }

    // If all studyrights are included, and transfer exists, define the start year in the programme, based on when the student transferred to it
    // Otherwise, the year is defined based on when the student started in the chosen master's programme
    const programmeStartDate = includeAllSpecials && transfer ? transfer.transferdate : masterStudyright?.studystartdate
    const startYear = defineYear(programmeStartDate, isAcademicYear)

    // The master studyright should have been given on the same date as the bachelor's
    if (years.includes(startYear) && code && masterStudyright.givendate.getTime() === givendate.getTime()) {
      stats[code][startYear] += 1
    }
  })

  const graphAndTableStats = formatStats(stats, years)
  return graphAndTableStats
}

const getProgrammesAfterGraduation = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const graduated = await graduatedStudyRights(studyprogramme, since)
  const graduatedStudents = graduated.map(s => s.studentnumber)

  // Get studyrights for masters studyprogramme. This excludes studytracks.
  const programmes = await getAllProgrammes()
  let studyrightsAfterThisProgramme = await followingStudyrights(since, programmes, graduatedStudents)
  const studyprogrammeCodes = uniqBy(studyrightsAfterThisProgramme, 'code').map(s => ({ code: s.code, name: s.name }))
  const stats = {}
  studyprogrammeCodes.forEach(c => (stats[c.code] = { ...c, ...getYearsObject({ years }) }))

  const transfers = await getTransferStudyrightMap(studyprogramme, since)

  studyrightsAfterThisProgramme.forEach(({ studentnumber, studystartdate, code, givendate }) => {
    const bachelorStudyright = graduated.find(s => s.studentnumber === studentnumber)

    // If special studyrights are excluded, transfers to the bachelor programme should be excluded
    if (!includeAllSpecials && transfers.get(bachelorStudyright.studyrightid)) {
      return
    }

    // If all studyrights are included, and transfer exists, define the start year in the programme, based on when the student transferred to it
    // Otherwise, the year is defined based on when the student started in the chosen master's programme
    const startYear = defineYear(studystartdate, isAcademicYear)

    // The master studyright should have been given on the same date as the bachelor's
    if (years.includes(startYear) && code && bachelorStudyright.givendate.getTime() === givendate.getTime()) {
      stats[code][startYear] += 1
    }
  })

  const graphAndTableStats = formatStats(stats, years)
  return graphAndTableStats
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
  const programmesBeforeOrAfter = studyprogramme.includes('KH')
    ? await getProgrammesAfterGraduation(queryParameters)
    : await getProgrammesBeforeStarting(queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles = ['', 'Graduated', 'Wrote thesis']
  const programmesBeforeOrAfterTitles = ['Code', 'Programme', ...years]
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
    totalAmounts: graduationTimeStats.totalAmounts,
    programmesBeforeOrAfterTableStats: programmesBeforeOrAfter.tableStats,
    programmesBeforeOrAfterGraphStats: programmesBeforeOrAfter.graphStats,
    programmesBeforeOrAfterTitles,
  }
}

module.exports = {
  getGraduationStatsForStudytrack,
}
