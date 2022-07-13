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
    years.push(Number(year))
  })

  // Graduated
  const graduatedGraphStats = [...graphStats]
  const graduatedTableStats = { ...tableStats }

  const graduatedRights = await graduatedStudyrights(faculty, since)
  const filteredGraduates = graduatedRights.filter(({ extentcode }) => [1, 2, 4].includes(extentcode))
  filteredGraduates.forEach(({ enddate }) => {
    const endYear = defineYear(enddate, isAcademicYear)
    graduatedGraphStats[indexOf(yearsArray, endYear)] += 1
    graduatedTableStats[endYear] += 1
  })

  allBasics.graphStats.push({ name: 'Graduated', data: graduatedGraphStats })
  Object.keys(graduatedTableStats).forEach(year => {
    counts[year].push(graduatedTableStats[year])
  })

  // combine tablestats from all categories
  allBasics.years = years
  years.forEach(year => {
    allBasics.tableStats.push([year, ...counts[year]])
  })
  allBasics.tableStats.reverse()
}

module.exports = { combineFacultyBasics }
