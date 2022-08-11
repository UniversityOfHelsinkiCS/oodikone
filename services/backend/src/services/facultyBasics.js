const { indexOf } = require('lodash')
const {
  startedStudyrights,
  graduatedStudyrights,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
  getProgrammeName,
} = require('./faculty')
const { getStatsBasis, getYearsArray, defineYear } = require('./studyprogrammeHelpers')

const findRightProgrammeName = (programme, studyrightElements) => {
  return studyrightElements.find(element => element.element_detail.code === programme).element_detail.name
}

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

const addProgramme = async (stats, programme, tableStats, transferYear, index, allBasics) => {
  if (!(programme in stats)) {
    stats[programme] = {}
    Object.keys(tableStats).forEach(year => (stats[programme][year] = [0, 0, 0]))
  }
  stats[programme][transferYear][index] += 1

  if (!(programme in allBasics.programmeNames)) {
    const { name } = await getProgrammeName(programme)
    allBasics.programmeNames[programme] = name
  }
}

const getFacultyStarters = async (
  faculty,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  counts,
  allBasics,
  programmeData
) => {
  const startedGraphStats = [...graphStats]
  const startedTableStats = { ...tableStats }
  const studyrights = await startedStudyrights(faculty, since)
  const filteredStudyrights = filterDuplicateStudyrights(studyrights)
  const programmeTableStats = {}

  filteredStudyrights.forEach(({ studystartdate, startedProgramme, studyrightElements }) => {
    const startYear = defineYear(studystartdate, isAcademicYear)
    startedGraphStats[indexOf(yearsArray, startYear)] += 1
    startedTableStats[startYear] += 1

    if (!(startedProgramme in programmeTableStats)) {
      programmeTableStats[startedProgramme] = { ...tableStats }
    }
    programmeTableStats[startedProgramme][startYear] += 1

    if (!(startedProgramme in allBasics.programmeNames)) {
      allBasics.programmeNames[startedProgramme] = findRightProgrammeName(startedProgramme, studyrightElements)
    }
  })

  allBasics.studentInfo.graphStats.push({ name: 'Started studying', data: startedGraphStats })
  programmeData['started'] = programmeTableStats

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
  countsGraduations,
  programmeData
) => {
  const graduatedGraphStats = [[...graphStats], [...graphStats], [...graphStats], [...graphStats], [...graphStats]]
  const graduatedTableStats = {}
  Object.keys(tableStats).forEach(year => (graduatedTableStats[year] = [0, 0, 0, 0, 0]))
  const programmeTableStats = {}

  const graduatedRights = await graduatedStudyrights(faculty, since)

  graduatedRights.forEach(({ enddate, extentcode, graduatedProgramme, studyrightElements }) => {
    const endYear = defineYear(enddate, isAcademicYear)
    graduatedGraphStats[0][indexOf(yearsArray, endYear)] += 1
    graduatedTableStats[endYear][0] += 1

    if (!(graduatedProgramme in programmeTableStats)) {
      programmeTableStats[graduatedProgramme] = {}
      Object.keys(tableStats).forEach(year => (programmeTableStats[graduatedProgramme][year] = [0, 0, 0, 0, 0]))
    }
    programmeTableStats[graduatedProgramme][endYear][0] += 1

    if (extentcode === 1) {
      graduatedGraphStats[1][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][1] += 1
      programmeTableStats[graduatedProgramme][endYear][1] += 1
    } else if (extentcode === 2) {
      graduatedGraphStats[2][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][2] += 1
      programmeTableStats[graduatedProgramme][endYear][2] += 1
    } else if (extentcode === 4) {
      graduatedGraphStats[3][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][3] += 1
      programmeTableStats[graduatedProgramme][endYear][3] += 1
    } else {
      graduatedGraphStats[4][indexOf(yearsArray, endYear)] += 1
      graduatedTableStats[endYear][4] += 1
      programmeTableStats[graduatedProgramme][endYear][4] += 1
    }

    if (!(graduatedProgramme in allBasics.programmeNames)) {
      allBasics.programmeNames[graduatedProgramme] = findRightProgrammeName(graduatedProgramme, studyrightElements)
    }
  })

  allBasics.studentInfo.graphStats.push({ name: 'Graduated', data: graduatedGraphStats[0] })

  allBasics.graduationInfo.graphStats.push({ name: 'All graduations', data: graduatedGraphStats[0] })
  allBasics.graduationInfo.graphStats.push({ name: 'Bachelors', data: graduatedGraphStats[1] })
  allBasics.graduationInfo.graphStats.push({ name: 'Masters', data: graduatedGraphStats[2] })
  allBasics.graduationInfo.graphStats.push({ name: 'Doctors', data: graduatedGraphStats[3] })
  allBasics.graduationInfo.graphStats.push({ name: 'Others', data: graduatedGraphStats[4] })

  programmeData['graduated'] = programmeTableStats

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
  counts,
  programmeData
) => {
  const insideTransfers = await transferredInsideFaculty(programmes, since)
  const awayTransfers = await transferredAway(programmes, since)
  const toTransfers = await transferredTo(programmes, since)

  const transferGraphStats = [[...graphStats], [...graphStats], [...graphStats]]
  const transferTableStats = {}
  Object.keys(tableStats).forEach(year => (transferTableStats[year] = [0, 0, 0]))
  const programmeTableStats = {}

  // inside transfer is counted towards target
  for (const { transferdate, targetcode } of insideTransfers) {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[0][indexOf(yearsArray, transferYear)] += 1
    transferTableStats[transferYear][0] += 1
    await addProgramme(programmeTableStats, targetcode, tableStats, transferYear, 0, allBasics)
  }
  for (const { transferdate, sourcecode } of awayTransfers) {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[1][indexOf(yearsArray, transferYear)] += 1
    transferTableStats[transferYear][1] += 1
    await addProgramme(programmeTableStats, sourcecode, tableStats, transferYear, 1, allBasics)
  }

  for (const { transferdate, targetcode } of toTransfers) {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[2][indexOf(yearsArray, transferYear)] += 1
    transferTableStats[transferYear][2] += 1
    await addProgramme(programmeTableStats, targetcode, tableStats, transferYear, 2, allBasics)
  }

  allBasics.studentInfo.graphStats.push({ name: 'Transferred inside', data: transferGraphStats[0] })
  allBasics.studentInfo.graphStats.push({ name: 'Transferred away', data: transferGraphStats[1] })
  allBasics.studentInfo.graphStats.push({ name: 'Transferred to', data: transferGraphStats[2] })

  programmeData['transferred'] = programmeTableStats

  Object.keys(transferTableStats).forEach(year => {
    counts[year] = counts[year].concat(transferTableStats[year])
  })
}

const combineFacultyBasics = async (allBasics, faculty, programmes, yearType) => {
  let counts = {}
  let countsGraduations = {}
  let years = []
  let programmeData = {}
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  const { graphStats, tableStats } = getStatsBasis(yearsArray)
  Object.keys(tableStats).forEach(year => years.push(year))

  // Started studying in faculty
  await getFacultyStarters(
    faculty,
    since,
    isAcademicYear,
    yearsArray,
    graphStats,
    tableStats,
    counts,
    allBasics,
    programmeData
  )

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
    countsGraduations,
    programmeData
  )

  // Transfers
  await getFacultyTransfers(
    programmes,
    since,
    isAcademicYear,
    yearsArray,
    graphStats,
    tableStats,
    allBasics,
    counts,
    programmeData
  )

  // combine tableStats from all categories
  allBasics.years = years
  years.forEach(year => {
    allBasics.studentInfo.tableStats.push([year, ...counts[year]])
    allBasics.graduationInfo.tableStats.push([year, ...countsGraduations[year]])
  })
  allBasics.studentInfo.tableStats.reverse()
  allBasics.graduationInfo.tableStats.reverse()

  //combine programme level tablestats
  // all programmes are not present in all data types, check all found programmes and patch missing details with 0

  let allCodes = Object.keys(programmeData.started).concat(
    Object.keys(programmeData.graduated),
    Object.keys(programmeData.transferred)
  )
  allCodes = [...new Set(allCodes)]

  let studentInfo = {}
  let graduationInfo = {}

  allCodes.forEach(code => {
    if (!(code in studentInfo)) studentInfo[code] = {}

    for (const year of years) {
      // started
      if (code in programmeData.started) {
        studentInfo[code][year] = [year, programmeData.started[code][year]]
      } else {
        studentInfo[code][year] = [year, 0]
      }
      // graduated total
      if (code in programmeData.graduated) {
        studentInfo[code][year] = studentInfo[code][year].concat([programmeData.graduated[code][year][0]])
        if (!(code in graduationInfo)) graduationInfo[code] = {}
        graduationInfo[code][year] = [year, ...programmeData.graduated[code][year].slice(1)]
      } else {
        studentInfo[code][year] = studentInfo[code][year].concat([0])
      }
      // trasferred
      if (code in programmeData.transferred) {
        studentInfo[code][year] = studentInfo[code][year].concat(programmeData.transferred[code][year])
      } else {
        studentInfo[code][year] = studentInfo[code][year].concat([0, 0, 0])
      }
    }
  })

  Object.keys(studentInfo).forEach(prog => {
    allBasics.studentInfo.programmeTableStats[prog] = [...Object.values(studentInfo[prog])].reverse()
  })

  Object.keys(graduationInfo).forEach(prog => {
    allBasics.graduationInfo.programmeTableStats[prog] = Object.values(graduationInfo[prog]).reverse()
  })
}

module.exports = { combineFacultyBasics }
