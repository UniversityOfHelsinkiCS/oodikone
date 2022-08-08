const { indexOf } = require('lodash')
const {
  startedStudyrights,
  graduatedStudyrights,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
} = require('./faculty')
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

const getFacultyStarters = async (
  faculty,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  counts,
  allBasics
) => {
  const startedGraphStats = [...graphStats]
  const startedTableStats = { ...tableStats }
  const studyrights = await startedStudyrights(faculty, since)
  const filteredStudyrights = filterDuplicateStudyrights(studyrights)
  const programmeTableStats = {}

  filteredStudyrights.forEach(({ studystartdate, startedProgramme }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    startedGraphStats[indexOf(yearsArray, startYear)] += 1
    startedTableStats[startYear] += 1

    if (!(startedProgramme in programmeTableStats)) {
      programmeTableStats[startedProgramme] = { ...tableStats }
    }
    programmeTableStats[startedProgramme][startYear] += 1
  })

  allBasics.studentInfo.graphStats.push({ name: 'Started studying', data: startedGraphStats })
  allBasics.startedProgrammes = programmeTableStats

  Object.keys(startedTableStats).forEach(year => {
    counts[year] = [startedTableStats[year]]
  })
}

const getFacultyGraduates = async (
  faculty,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  allBasics,
  counts,
  countsGraduations
) => {
  const graduatedGraphStats = [[...graphStats], [...graphStats], [...graphStats], [...graphStats], [...graphStats]]
  const graduatedTableStats = {}
  Object.keys(tableStats).forEach(year => (graduatedTableStats[year] = [0, 0, 0, 0, 0]))

  const graduatedRights = await graduatedStudyrights(faculty, since)

  graduatedRights.forEach(({ enddate, extentcode }) => {
    const endYear = defineYear(enddate, isAcademicYear)
    graduatedGraphStats[0][indexOf(yearsArray, endYear)] += 1
    graduatedTableStats[endYear][0] += 1

    if (extentcode === 1) {
      graduatedGraphStats[1][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][1] += 1
    } else if (extentcode === 2) {
      graduatedGraphStats[2][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][2] += 1
    } else if (extentcode === 4) {
      graduatedGraphStats[3][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][3] += 1
    } else {
      graduatedGraphStats[4][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][4] += 1
    }
  })

  allBasics.studentInfo.graphStats.push({ name: 'All graduated', data: graduatedGraphStats[0] })

  allBasics.graduationInfo.graphStats.push({ name: 'All graduated', data: graduatedGraphStats[0] })
  allBasics.graduationInfo.graphStats.push({ name: 'Graduated bachelors', data: graduatedGraphStats[1] })
  allBasics.graduationInfo.graphStats.push({ name: 'Graduated masters', data: graduatedGraphStats[2] })
  allBasics.graduationInfo.graphStats.push({ name: 'Graduated doctors', data: graduatedGraphStats[3] })
  allBasics.graduationInfo.graphStats.push({ name: 'Other graduations', data: graduatedGraphStats[4] })

  Object.keys(graduatedTableStats).forEach(year => {
    counts[year] = counts[year].concat(graduatedTableStats[year][0])
    countsGraduations[year] = graduatedTableStats[year]
  })
}

const getFacultyTransfers = async (
  programmes,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  allBasics,
  counts
) => {
  const insideTransfers = await transferredInsideFaculty(programmes, since)
  const awayTransfers = await transferredAway(programmes, since)
  const toTransfers = await transferredTo(programmes, since)

  const transferGraphStats = [[...graphStats], [...graphStats], [...graphStats]]
  const transferTableStats = {}
  Object.keys(tableStats).forEach(year => (transferTableStats[year] = [0, 0, 0]))

  insideTransfers.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[0][indexOf(yearsArray, transferYear)] += 1
    transferTableStats[transferYear][0] += 1
  })

  awayTransfers.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[1][indexOf(yearsArray, transferYear)] += 1
    transferTableStats[transferYear][1] += 1
  })

  toTransfers.forEach(({ transferdate }) => {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[2][indexOf(yearsArray, transferYear)] += 1
    transferTableStats[transferYear][2] += 1
  })

  allBasics.studentInfo.graphStats.push({ name: 'Transferred inside', data: transferGraphStats[0] })
  allBasics.studentInfo.graphStats.push({ name: 'Transferred away', data: transferGraphStats[1] })
  allBasics.studentInfo.graphStats.push({ name: 'Transferred to', data: transferGraphStats[2] })

  Object.keys(transferTableStats).forEach(year => {
    counts[year] = counts[year].concat(transferTableStats[year])
  })
}

const combineFacultyBasics = async (allBasics, faculty, programmes, yearType) => {
  let counts = {}
  let countsGraduations = {}
  let years = []
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  const { graphStats, tableStats } = getStatsBasis(yearsArray)
  Object.keys(tableStats).forEach(year => years.push(year))

  // Started studying in faculty
  await getFacultyStarters(faculty, since, isAcademicYear, yearsArray, graphStats, tableStats, counts, allBasics)

  // Graduated in faculty
  await getFacultyGraduates(
    faculty,
    since,
    isAcademicYear,
    yearsArray,
    graphStats,
    tableStats,
    allBasics,
    counts,
    countsGraduations
  )

  // Transfers
  await getFacultyTransfers(programmes, since, isAcademicYear, yearsArray, graphStats, tableStats, allBasics, counts)

  // combine tableStats from all categories
  allBasics.years = years
  years.forEach(year => {
    allBasics.studentInfo.tableStats.push([year, ...counts[year]])
    allBasics.graduationInfo.tableStats.push([year, ...countsGraduations[year]])
  })
  allBasics.studentInfo.tableStats.reverse()
  allBasics.graduationInfo.tableStats.reverse()
}

module.exports = { combineFacultyBasics }
