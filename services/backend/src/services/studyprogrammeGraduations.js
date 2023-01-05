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
  getStartDate,
  getThesisType,
  alltimeStartDate,
  alltimeEndDate,
  getId,
  getGoal,
} = require('./studyprogrammeHelpers')
const {
  graduatedStudyRights,
  getThesisCredits,
  followingStudyrights,
  previousStudyrights,
  allStudyrights,
  allTransfers,
} = require('./studyprogramme')
const { countTimeCategories, bachelorStudyright, getStatutoryAbsences } = require('./graduationHelpers')
const { getAllProgrammes } = require('./studyrights')

const checkStartdate = async (id, startdate) => {
  if (id.slice(-2) === '-1') {
    return startdate
  }
  const studyright = await bachelorStudyright(id.replace(/-2$/, '-1'))
  if (studyright) return studyright.startdate
  return null
}

const addGraduation = async (studyright, isAcademicYear, amounts, times) => {
  const startdate = await checkStartdate(studyright.studyrightid, studyright.startdate)
  const graduationYear = defineYear(studyright.enddate, isAcademicYear)

  const totalTimeToGraduation = moment(studyright.enddate).diff(moment(startdate), 'months')
  const statutoryAbsences = await getStatutoryAbsences(studyright.studentnumber, startdate, studyright.enddate)
  const timeToGraduation = totalTimeToGraduation - statutoryAbsences

  amounts[graduationYear] += 1
  times[graduationYear] = [...times[graduationYear], timeToGraduation]
}

const getGraduatedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)

  const studentnumbers = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
  })

  const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbers)
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

const getThesisStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const providercode = mapToProviders([studyprogramme])[0]
  const thesisType = getThesisType(studyprogramme)
  const { graphStats, tableStats } = getStatsBasis(years)

  const studentnumbers = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
  })

  const credits = await getThesisCredits(providercode, since, thesisType, studentnumbers)

  credits?.forEach(({ attainment_date }) => {
    const attainmentYear = defineYear(attainment_date, isAcademicYear)
    graphStats[indexOf(years, attainmentYear)] += 1
    tableStats[attainmentYear] += 1
  })

  return { graphStats, tableStats }
}

const getGraduationTimeStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  let graduationAmounts = getYearsObject({ years })
  let graduationTimes = getYearsObject({ years, emptyArrays: true })
  // for bc+ms combo
  const doCombo = studyprogramme.startsWith('MH') && !['MH30_001', 'MH30_003'].includes(studyprogramme)
  let graduationAmountsCombo = getYearsObject({ years })
  let graduationTimesCombo = getYearsObject({ years, emptyArrays: true })

  const studentnumbers = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
  })

  const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbers)

  // for masters, separate bc+ms combo from just ms students (except some medical progs)
  for (const right of studyrights) {
    if (doCombo && right.studyrightid.slice(-2) === '-2') {
      await addGraduation(right, isAcademicYear, graduationAmountsCombo, graduationTimesCombo)
    } else {
      await addGraduation(right, isAcademicYear, graduationAmounts, graduationTimes)
    }
  }

  const goal = getGoal(studyprogramme)
  const times = { medians: [], goal }
  const comboTimes = { medians: [], goal: goal + 36 }

  const rev = [...years].reverse()
  for (const year of rev) {
    const median = getMedian(graduationTimes[year])
    const statistics = countTimeCategories(graduationTimes[year], goal)
    times.medians = [...times.medians, { y: median, amount: graduationAmounts[year], name: year, statistics }]

    if (doCombo) {
      const median = getMedian(graduationTimesCombo[year])
      const statistics = countTimeCategories(graduationTimesCombo[year], goal + 36)
      comboTimes.medians = [
        ...comboTimes.medians,
        { y: median, amount: graduationAmountsCombo[year], name: year, statistics },
      ]
    }
  }
  return { times, doCombo, comboTimes }
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
    .map(p => [p.code, getId(p.code), p.name['fi'], ...years.map(year => p[year])])

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
  let studyrightsBeforeMasters = await previousStudyrights(programmes, allStudents)
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

const getProgrammesBeforeOrAfter = async (studyprogramme, queryParameters) => {
  if (studyprogramme.includes('KH')) return await getProgrammesAfterGraduation(queryParameters)
  if (studyprogramme.includes('MH')) return await getProgrammesBeforeStarting(queryParameters)
  return null
}

const getGraduationStatsForStudytrack = async ({ studyprogramme, settings }) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)

  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const thesis = await getThesisStats(queryParameters)

  const graduated = await getGraduatedStats(queryParameters)

  const graduationTimeStats = await getGraduationTimeStats(queryParameters)

  const programmesBeforeOrAfter = await getProgrammesBeforeOrAfter(studyprogramme, queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles = ['', 'Graduated', 'Wrote thesis']
  const programmesBeforeOrAfterTitles = ['Code', 'Id', 'Programme', ...years]
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
    graduationTimes: graduationTimeStats.times,
    doCombo: graduationTimeStats.doCombo,
    comboTimes: graduationTimeStats.comboTimes,
    programmesBeforeOrAfterTableStats: programmesBeforeOrAfter?.tableStats,
    programmesBeforeOrAfterGraphStats: programmesBeforeOrAfter?.graphStats,
    programmesBeforeOrAfterTitles,
  }
}

module.exports = {
  getGraduationStatsForStudytrack,
}
