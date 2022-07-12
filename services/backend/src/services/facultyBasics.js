const { indexOf } = require('lodash')
const { startedStudyrights } = require('./faculty')
const { getGraduatedStats } = require('./studyprogrammeBasics')
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
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  const { graphStats, tableStats } = getStatsBasis(yearsArray)
  const parameters = { since, years: yearsArray, isAcademicYear, includeAllSpecials }

  // Started studying in faculty
  const studyrights = await startedStudyrights(faculty, since)
  const filteredStudyrights = filterDuplicateStudyrights(studyrights)

  filteredStudyrights.forEach(({ studystartdate }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    graphStats[indexOf(yearsArray, startYear)] += 1
    tableStats[startYear] += 1
  })
  allBasics.graphStats.push({ name: 'Started studying', data: graphStats })

  Object.keys(tableStats).forEach(year => {
    counts[year] = [tableStats[year]]
    years.push(Number(year))
  })

  // Graduated
  for (const studyprogramme of programmes) {
    const graduated = await getGraduatedStats({ studyprogramme, ...parameters })
    if (graduated) {
      Object.keys(graduated.tableStats).forEach(year => {
        if (counts[year][1] === undefined) counts[year].push(graduated.tableStats[year])
        else counts[year][1] += graduated.tableStats[year]
      })
    }
  }
  let graduated = []
  for (const year of years) {
    graduated.push(counts[year][1])
  }
  allBasics.graphStats.push({ name: 'Graduated', data: graduated })

  // combine tablestats from all categories
  allBasics.years = years
  years.forEach(year => {
    allBasics.tableStats.push([year, ...counts[year]])
  })
  allBasics.tableStats.reverse()
}

module.exports = { combineFacultyBasics }
