const { indexOf, orderBy } = require('lodash')
const moment = require('moment')

const { sortByProgrammeCode } = require('../../util')
const { mapToProviders } = require('../../util/map')
const { countTimeCategories, getBachelorStudyRight, getStatutoryAbsences } = require('../graduationHelpers')
const { getThesisCredits } = require('./creditGetters')
const {
  alltimeEndDate,
  alltimeStartDate,
  defineYear,
  getCorrectStudentnumbers,
  getGoal,
  getId,
  getMedian,
  getStartDate,
  getStatsBasis,
  getThesisType,
  getYearsArray,
  getYearsObject,
} = require('./studyprogrammeHelpers')
const { getStudyRightsInProgramme, graduatedStudyRights } = require('./studyrightFinders')

const checkStartdate = async (id, startdate) => {
  if (id.slice(-2) === '-1') {
    return startdate
  }
  const studyright = await getBachelorStudyRight(id.replace(/-2$/, '-1'))
  if (studyright) return studyright.startdate
  return null
}

const addGraduation = async (studyright, isAcademicYear, amounts, times) => {
  const startdate = await checkStartdate(studyright.studyrightid, studyright.startdate)
  const graduationYear = defineYear(studyright.enddate, isAcademicYear)
  const totalTimeToGraduation = moment(studyright.enddate).diff(moment(startdate), 'months')
  const statutoryAbsences = await getStatutoryAbsences(studyright.studentNumber, startdate, studyright.enddate)
  const timeToGraduation = totalTimeToGraduation - statutoryAbsences

  amounts[graduationYear] += 1
  times[graduationYear] = [...times[graduationYear], timeToGraduation]
}

const getGraduatedStats = async ({ studyprogramme, since, years, isAcademicYear, includeAllSpecials }) => {
  const { graphStats, tableStats } = getStatsBasis(years)
  if (!studyprogramme) return { graphStats, tableStats }
  const studentnumbers = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
    includeTransferredTo: includeAllSpecials,
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
  const { graphStats, tableStats } = getStatsBasis(years)
  if (!studyprogramme) return { graphStats, tableStats }
  const providercode = mapToProviders([studyprogramme])[0]
  const thesisType = getThesisType(studyprogramme)

  const studentnumbers = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
    includeTransferredTo: includeAllSpecials,
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
  const graduationAmounts = getYearsObject({ years })
  const graduationTimes = getYearsObject({ years, emptyArrays: true })
  if (!studyprogramme) return { times: { medians: [], goal: 0 }, doCombo: false, comboTimes: { medians: [], goal: 0 } }
  // for bc+ms combo
  const doCombo = studyprogramme.startsWith('MH') && !['MH30_001', 'MH30_003'].includes(studyprogramme)
  const graduationAmountsCombo = getYearsObject({ years })
  const graduationTimesCombo = getYearsObject({ years, emptyArrays: true })

  const studentnumbers = await getCorrectStudentnumbers({
    codes: [studyprogramme],
    startDate: alltimeStartDate,
    endDate: alltimeEndDate,
    includeAllSpecials,
    includeTransferredTo: includeAllSpecials,
  })
  const studyrights = await graduatedStudyRights(studyprogramme, since, studentnumbers)
  // for masters, separate bc+ms combo from just ms students (except some medical progs)
  for (const right of studyrights) {
    const elements = right.studyrightElements.filter(
      element => new Date(element.enddate).toDateString() === new Date(right.enddate).toDateString()
    )
    if (elements.length === 0) continue
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

const formatStats = (stats, years) => {
  const tableStats = Object.values(stats)
    .filter(p => years.map(year => p[year]).find(started => started !== 0)) // Filter out programmes with no-one started between the selected years
    .map(p => [p.code, getId(p.code), p.name, ...years.map(year => p[year])])
    .sort((a, b) => sortByProgrammeCode(a[0], b[0]))

  const graphStats = Object.values(stats)
    .filter(p => years.map(year => p[year]).find(started => started !== 0)) // Filter out programmes with no-one started between the selected years
    .map(p => ({ name: p.name, code: p.code, data: years.map(year => p[year]) }))
    .sort((a, b) => sortByProgrammeCode(a.code, b.code))

  return { tableStats, graphStats }
}

const getProgrammesBeforeStarting = async ({ studyprogramme, years, isAcademicYear, includeAllSpecials }) => {
  const studyRights = await getStudyRightsInProgramme(studyprogramme, false)

  const stats = studyRights.reduce((acc, studyRight) => {
    // If the extent code is something else, that means the student hasn't continued from a bachelor's programme
    if (studyRight.extentCode !== 5) return acc
    const phase1Programmes = studyRight.studyRightElements.filter(elem => elem.phase === 1)
    const [latestPhase1Programme] = orderBy(phase1Programmes, ['endDate'], ['desc'])
    if (!acc[latestPhase1Programme.code]) {
      acc[latestPhase1Programme.code] = { ...latestPhase1Programme, ...getYearsObject({ years }) }
    }
    const phase2Programmes = studyRight.studyRightElements.filter(elem => elem.phase === 2)

    // If there's more than one programme of phase 2, the student has transferred from/to another programme
    if (!includeAllSpecials && phase2Programmes.length > 1) return acc

    const startDateInProgramme = phase2Programmes.find(elem => elem.code === studyprogramme).startDate
    acc[latestPhase1Programme.code][defineYear(startDateInProgramme, isAcademicYear)] += 1
    return acc
  }, {})

  const graphAndTableStats = formatStats(stats, years)
  return graphAndTableStats
}

const getProgrammesAfterGraduation = async ({ studyprogramme, years, isAcademicYear, includeAllSpecials }) => {
  const studyRights = await getStudyRightsInProgramme(studyprogramme, true)

  const stats = studyRights.reduce((acc, studyRight) => {
    const phase1Programmes = studyRight.studyRightElements.filter(elem => elem.phase === 1)

    // If there's more than one programme of phase 1, the student has transferred from/to another programme
    if (!includeAllSpecials && phase1Programmes.length > 1) return acc

    const phase2Programmes = studyRight.studyRightElements.filter(elem => elem.phase === 2)
    const [firstPhase2Programme] = orderBy(phase2Programmes, ['startDate'], ['asc'])
    if (!firstPhase2Programme) return acc

    if (!acc[firstPhase2Programme.code]) {
      acc[firstPhase2Programme.code] = { ...firstPhase2Programme, ...getYearsObject({ years }) }
    }

    acc[firstPhase2Programme.code][defineYear(firstPhase2Programme.startDate, isAcademicYear)] += 1
    return acc
  }, {})

  const graphAndTableStats = formatStats(stats, years)
  return graphAndTableStats
}

const getProgrammesBeforeOrAfter = async (studyprogramme, queryParameters) => {
  if (studyprogramme.includes('KH')) return await getProgrammesAfterGraduation(queryParameters)
  if (studyprogramme.includes('MH')) return await getProgrammesBeforeStarting(queryParameters)
  return null
}

const getGraduationStatsForStudytrack = async ({ studyprogramme, combinedProgramme, settings }) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(studyprogramme, isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear)
  const queryParameters = { studyprogramme, since, years, isAcademicYear, includeAllSpecials }
  const combinedQueryParameters = {
    studyprogramme: combinedProgramme,
    since,
    years,
    isAcademicYear,
    includeAllSpecials,
  }

  const thesis = await getThesisStats(queryParameters)
  const thesisSecondProgramme = await getThesisStats(combinedQueryParameters)

  const graduated = await getGraduatedStats(queryParameters)
  const graduatedSecondProgramme = await getGraduatedStats(combinedQueryParameters)

  const graduationTimeStats = await getGraduationTimeStats(queryParameters)
  const graduationTimeStatsSecondProg = await getGraduationTimeStats(combinedQueryParameters)

  const programmesBeforeOrAfter = await getProgrammesBeforeOrAfter(studyprogramme, queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles =
    studyprogramme.includes('LIS') || studyprogramme.includes('T')
      ? ['', 'Graduated']
      : ['', 'Graduated', 'Wrote thesis']
  const combinedTitles = [
    '',
    'Graduated bachelor',
    'Wrote thesis bachelor',
    'Graduated licentiate',
    'Wrote thesis licentiate',
  ]
  const programmesBeforeOrAfterTitles = ['Code', 'Id', 'Programme', ...years]
  const tableStatsDefault = combinedProgramme
    ? reversedYears.map(year => [
        year,
        graduated.tableStats[year],
        thesis.tableStats[year],
        graduatedSecondProgramme.tableStats[year],
        thesisSecondProgramme.tableStats[year],
      ])
    : reversedYears.map(year => [year, graduated.tableStats[year], thesis.tableStats[year]])

  const tableStats =
    studyprogramme.includes('LIS') || studyprogramme.includes('T')
      ? reversedYears.map(year => [year, graduated.tableStats[year]])
      : tableStatsDefault

  const graphStats = combinedProgramme
    ? [
        {
          name: 'Graduated bachelor',
          data: graduated.graphStats,
        },
        {
          name: 'Wrote thesis bachelor',
          data: thesis.graphStats,
        },
        {
          name: 'Graduated licentiate',
          data: graduatedSecondProgramme.graphStats,
        },
        {
          name: 'Wrote thesis licentiate',
          data: thesisSecondProgramme.graphStats,
        },
      ]
    : [
        {
          name: 'Graduated students',
          data: graduated.graphStats,
        },
        {
          name: 'Wrote thesis',
          data: thesis.graphStats,
        },
      ]

  return {
    id: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
    years,
    tableStats,
    titles: combinedProgramme ? combinedTitles : titles,
    graphStats:
      studyprogramme.includes('LIS') || studyprogramme.includes('T')
        ? [
            {
              name: 'Graduated students',
              data: graduated.graphStats,
            },
          ]
        : graphStats,
    graduationTimes: graduationTimeStats.times,
    doCombo: graduationTimeStats.doCombo,
    comboTimes: graduationTimeStats.comboTimes,
    graduationTimesSecondProgramme: graduationTimeStatsSecondProg.comboTimes,
    programmesBeforeOrAfterTableStats: programmesBeforeOrAfter?.tableStats,
    programmesBeforeOrAfterGraphStats: programmesBeforeOrAfter?.graphStats,
    programmesBeforeOrAfterTitles,
  }
}

module.exports = {
  getGraduationStatsForStudytrack,
}
