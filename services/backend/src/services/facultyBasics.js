const { indexOf } = require('lodash')
const { startedStudyrights, graduatedStudyrights } = require('./faculty')
const { getStatsBasis, getYearsArray, defineYear } = require('./studyprogrammeHelpers')

const filterDuplicateStudyrights = studyrights => {
  // bachelor+master students have two studyrights (separated by two last digits in studyrightid)
  // choose only the earlier started one, so we don't count start of masters as starting in faculty
  let rightsToCount = {}

  studyrights.forEach(right => {
    const id = right.studyrightid.slice(0, -2)
    const start = new Date(right.studystartdate)
    if (id in rightsToCount) {
      if (new Date(rightsToCount[id].studystartdate) > start) {
        rightsToCount[id] = right
      }
    } else {
      rightsToCount[id] = right
    }
  })
  return Object.values(rightsToCount)
}

const combineFacultyBasics = async (allBasics, faculty, programmes, yearType, specialGroups, counts, years) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  let { graphStats, tableStats } = getStatsBasis(yearsArray)

  const startedGraphStats = [...graphStats]
  const startedTableStats = { ...tableStats }

  // Started studying in faculty
  const studyrights = await startedStudyrights(faculty, since)
  const filteredStudyrights = filterDuplicateStudyrights(studyrights)

  filteredStudyrights.forEach(({ studystartdate }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    startedGraphStats[indexOf(yearsArray, startYear)] += 1
    startedTableStats[startYear] += 1
  })
  allBasics.graphStats.push({ name: 'Started studying', data: startedGraphStats })

  Object.keys(startedTableStats).forEach(year => {
    counts[year] = [startedTableStats[year]]
    years.push(year)
  })

  // Graduated
  const graduatedGraphStats = [...graphStats]
  const graduatedTableStats = { ...tableStats }

  const bachelorGraphStats = [...graphStats]
  const bachelorTableStats = { ...tableStats }
  const masterGraphStats = [...graphStats]
  const masterTableStats = { ...tableStats }
  const doctorGraphStats = [...graphStats]
  const doctorTableStats = { ...tableStats }
  const otherGraphStats = [...graphStats]
  const otherTableStats = { ...tableStats }

  const graduatedRights = await graduatedStudyrights(faculty, since)
  graduatedRights.forEach(({ enddate, extentcode }) => {
    const endYear = defineYear(enddate, isAcademicYear)
    graduatedGraphStats[indexOf(yearsArray, endYear)] += 1
    graduatedTableStats[endYear] += 1

    if (extentcode === 1) {
      bachelorGraphStats[indexOf(yearsArray, endYear)] += 1
      bachelorTableStats[endYear] += 1
    } else if (extentcode === 2) {
      masterGraphStats[indexOf(yearsArray, endYear)] += 1
      masterTableStats[endYear] += 1
    } else if (extentcode === 4) {
      doctorGraphStats[indexOf(yearsArray, endYear)] += 1
      doctorTableStats[endYear] += 1
    } else {
      otherGraphStats[indexOf(yearsArray, endYear)] += 1
      otherTableStats[endYear] += 1
    }
  })

  allBasics.graphStats.push({ name: 'All graduated', data: graduatedGraphStats })
  allBasics.graphStats.push({ name: 'Graduated bachelors', data: bachelorGraphStats })
  allBasics.graphStats.push({ name: 'Graduated masters', data: masterGraphStats })
  allBasics.graphStats.push({ name: 'Graduated doctors', data: doctorGraphStats })
  allBasics.graphStats.push({ name: 'Other graduations', data: otherGraphStats })

  Object.keys(graduatedTableStats).forEach(year => {
    counts[year].push(graduatedTableStats[year])
    counts[year].push(bachelorTableStats[year])
    counts[year].push(masterTableStats[year])
    counts[year].push(doctorTableStats[year])
    counts[year].push(otherTableStats[year])
  })
  // combine tablestats from all categories
  allBasics.years = years
  years.forEach(year => {
    allBasics.tableStats.push([year, ...counts[year]])
  })
  allBasics.tableStats.reverse()
}

module.exports = { combineFacultyBasics }
