const { indexOf, isArray } = require('lodash')
const moment = require('moment')
const {
  startedStudyrights,
  graduatedStudyrights,
  transferredInsideFaculty,
  transferredAway,
  transferredTo,
  getTransferredToAndAway,
  getTransferredInside,
  studyrightsByRightStartYear,
  getTransfersIn,
} = require('./faculty')
const { getStatsBasis, getYearsArray, defineYear } = require('../studyprogrammeHelpers')
const { findRightProgramme, isNewProgramme, checkTransfers, getExtentFilter } = require('./facultyHelpers')
const { codes } = require('../../../config/programmeCodes')

const filterDuplicateStudyrights = studyrights => {
  // bachelor+master students have two studyrights (separated by two last digits in studyrightid)
  // choose only bachelor one, so we don't count start of masters as starting in faculty
  let rightsToCount = {}

  studyrights.forEach(right => {
    const id = right.studyrightid.slice(0, -2)
    if (right.studyrightid.slice(-2) === '-1') {
      rightsToCount[id] = right
    }
  })
  return Object.values(rightsToCount)
}

const addProgramme = async (
  stats,
  programme,
  tableStats,
  transferYear,
  index,
  allBasics,
  facultyProgrammes,
  includeAllSpecials
) => {
  let { progId, name, code } = facultyProgrammes.filter(prog => prog.code === programme)[0]
  if (!(progId in stats)) {
    stats[progId] = {}
    if (includeAllSpecials) {
      Object.keys(tableStats).forEach(year => (stats[progId][year] = [0, 0, 0]))
    } else {
      Object.keys(tableStats).forEach(year => (stats[progId][year] = [0]))
    }
  }
  stats[progId][transferYear][index] += 1
  if (!(progId in allBasics.programmeNames)) {
    allBasics.programmeNames[progId] = { ...name, code: code }
  }
}

const getFacultyStarters = async (
  faculty,
  programmes,
  transfersToOrAwayStudyrights,
  insideTransfersStudyrights,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  counts,
  allBasics,
  programmeData,
  programmeFilter,
  includeAllSpecials
) => {
  const startedGraphStats = [...graphStats]
  const startedTableStats = { ...tableStats }
  const programmeTableStats = {}
  const studyrightWhere = getExtentFilter(includeAllSpecials)
  const start = new Date('2017-01-01').toUTCString()
  const end = new Date()
  for (const code of programmes) {
    const studyrights = await startedStudyrights(faculty, code, since, studyrightWhere)
    let filteredStudyrights = filterDuplicateStudyrights(studyrights)
    const insideTransfers = await getTransfersIn(code, start, end)
    filteredStudyrights = filteredStudyrights.filter(s => !checkTransfers(s, insideTransfers, insideTransfers))
    const keys = Object.keys(codes)

    if (!includeAllSpecials) {
      // We do not include inside transferred studyrights into faculty starters, but function below expect two arguments
      filteredStudyrights = filteredStudyrights.filter(
        s => !checkTransfers(s, insideTransfersStudyrights, transfersToOrAwayStudyrights)
      )
    }

    filteredStudyrights.forEach(({ startdate, studyrightElements }) => {
      const { programme, programmeName } = findRightProgramme(studyrightElements, code)
      let programmeId = programme

      if (keys.includes(programme)) {
        programmeId = codes[programme].toUpperCase()
      }

      if (programmeFilter === 'ALL_PROGRAMMES' || isNewProgramme(programme)) {
        const startYear = defineYear(startdate, isAcademicYear)

        startedGraphStats[indexOf(yearsArray, startYear)] += 1
        startedTableStats[startYear] += 1

        if (!(programmeId in programmeTableStats)) {
          programmeTableStats[programmeId] = { ...tableStats }
        }
        programmeTableStats[programmeId][startYear] += 1

        if (!(programmeId in allBasics.programmeNames)) {
          allBasics.programmeNames[programmeId] = { ...programmeName, code: programme }
        }
      }
    })
  }
  allBasics.studentInfo.graphStats.push({ name: 'Started studying (new in faculty)', data: startedGraphStats })
  programmeData['started'] = programmeTableStats

  Object.keys(startedTableStats).forEach(year => {
    counts[year] = [startedTableStats[year]]
  })
}

const getFacultyGraduates = async (
  faculty,
  programmes,
  transfersToOrAwayStudyrights,
  insideTransfersStudyrights,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  allBasics,
  counts,
  countsGraduations,
  programmeData,
  programmeFilter,
  includeAllSpecials
) => {
  const graduatedGraphStats = [[...graphStats], [...graphStats], [...graphStats], [...graphStats], [...graphStats]]
  const graduatedTableStats = {}
  const programmeTableStats = {}
  Object.keys(tableStats).forEach(year => (graduatedTableStats[year] = [0, 0, 0, 0, 0]))
  const keys = Object.keys(codes)
  let studyrightWhere = getExtentFilter(includeAllSpecials)
  for (const code of programmes) {
    let graduatedRights = await graduatedStudyrights(faculty, code, since, studyrightWhere)
    if (!includeAllSpecials) {
      graduatedRights = graduatedRights.filter(
        s => !checkTransfers(s, insideTransfersStudyrights, transfersToOrAwayStudyrights)
      )
    }
    graduatedRights.forEach(({ enddate, extentcode, studyrightElements }) => {
      const { programme, programmeName } = findRightProgramme(studyrightElements, code)
      if (!studyrightElements.find(sre => new Date(sre.enddate).getTime() === new Date(enddate).getTime())) return
      let programmeId = programme

      if (keys.includes(programme)) {
        programmeId = codes[programme].toUpperCase()
      }

      if (programmeFilter === 'ALL_PROGRAMMES' || isNewProgramme(programme)) {
        const endYear = defineYear(enddate, isAcademicYear)
        graduatedGraphStats[0][indexOf(yearsArray, endYear)] += 1
        graduatedTableStats[endYear][0] += 1

        if (!(programmeId in programmeTableStats)) {
          programmeTableStats[programmeId] = {}
          Object.keys(tableStats).forEach(year => (programmeTableStats[programmeId][year] = [0, 0, 0, 0, 0]))
        }
        programmeTableStats[programmeId][endYear][0] += 1

        if (extentcode === 1) {
          graduatedGraphStats[1][indexOf(yearsArray, endYear)] += 1
          graduatedTableStats[endYear][1] += 1
          programmeTableStats[programmeId][endYear][1] += 1
        } else if (extentcode === 2) {
          graduatedGraphStats[2][indexOf(yearsArray, endYear)] += 1
          graduatedTableStats[endYear][2] += 1
          programmeTableStats[programmeId][endYear][2] += 1
        } else if (extentcode === 4) {
          graduatedGraphStats[3][indexOf(yearsArray, endYear)] += 1
          graduatedTableStats[endYear][3] += 1
          programmeTableStats[programmeId][endYear][3] += 1
        } else {
          graduatedGraphStats[4][indexOf(yearsArray, endYear)] += 1
          graduatedTableStats[endYear][4] += 1
          programmeTableStats[programmeId][endYear][4] += 1
        }

        if (!(programmeId in allBasics.programmeNames)) {
          allBasics.programmeNames[programmeId] = { code: programme, ...programmeName }
        }
      }
    })
  }

  allBasics.studentInfo.graphStats.push({ name: 'Graduated', data: graduatedGraphStats[0] })
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
// If includeAllSpecial false, inside transfers should contain only students started after 1.8.2017.
const getInsideTransfers = async (programmeCodes, allProgrammeCodes, since, includeAllSpecials, faculty) => {
  if (includeAllSpecials) {
    return await transferredInsideFaculty(programmeCodes, allProgrammeCodes, since)
  }
  const insiders = await transferredInsideFaculty(programmeCodes, allProgrammeCodes, since)
  const studyrights = (
    await studyrightsByRightStartYear(faculty, new Date(moment('2017-08-01', 'YYYY-MM-DD')).toUTCString())
  ).map(sr => sr.studyrightid)
  const filteredTransfers = insiders.filter(tr => studyrights.includes(tr.studyrightid))
  return filteredTransfers
}
const getFacultyTransfers = async (
  programmes,
  programmeCodes,
  allProgrammeCodes,
  since,
  isAcademicYear,
  yearsArray,
  graphStats,
  tableStats,
  allBasics,
  counts,
  programmeData,
  includeAllSpecials,
  faculty
) => {
  const insideTransfers = await getInsideTransfers(
    programmeCodes,
    allProgrammeCodes,
    since,
    includeAllSpecials,
    faculty
  )
  let transferGraphStats = []
  let transferTableStats = {}
  if (includeAllSpecials) {
    transferGraphStats = [[...graphStats], [...graphStats], [...graphStats]]
    Object.keys(tableStats).forEach(year => (transferTableStats[year] = [0, 0, 0]))
  } else {
    transferGraphStats = [[...graphStats]]
    Object.keys(tableStats).forEach(year => (transferTableStats[year] = [0]))
  }

  const programmeTableStats = {}
  // inside transfer is counted towards target
  for (const { transferdate, targetcode } of insideTransfers) {
    const transferYear = defineYear(transferdate, isAcademicYear)
    transferGraphStats[0][indexOf(yearsArray, transferYear)] += 1
    if (isArray(transferTableStats[transferYear])) {
      transferTableStats[transferYear][0] += 1
      await addProgramme(
        programmeTableStats,
        targetcode,
        tableStats,
        transferYear,
        0,
        allBasics,
        programmes,
        includeAllSpecials
      )
    }
  }
  if (includeAllSpecials) {
    const awayTransfers = await transferredAway(programmeCodes, allProgrammeCodes, since)
    const toTransfers = await transferredTo(programmeCodes, allProgrammeCodes, since)

    for (const { transferdate, sourcecode } of awayTransfers) {
      const transferYear = defineYear(transferdate, isAcademicYear)
      if (isArray(transferTableStats[transferYear])) {
        transferGraphStats[1][indexOf(yearsArray, transferYear)] += 1
        transferTableStats[transferYear][1] += 1
        await addProgramme(
          programmeTableStats,
          sourcecode,
          tableStats,
          transferYear,
          1,
          allBasics,
          programmes,
          includeAllSpecials
        )
      }
    }

    for (const { transferdate, targetcode } of toTransfers) {
      const transferYear = defineYear(transferdate, isAcademicYear)
      if (isArray(transferTableStats[transferYear])) {
        transferGraphStats[2][indexOf(yearsArray, transferYear)] += 1
        transferTableStats[transferYear][2] += 1
        await addProgramme(
          programmeTableStats,
          targetcode,
          tableStats,
          transferYear,
          2,
          allBasics,
          programmes,
          includeAllSpecials
        )
      }
    }
  }

  allBasics.studentInfo.graphStats.push({ name: 'Transferred inside', data: transferGraphStats[0] })
  if (includeAllSpecials) {
    allBasics.studentInfo.graphStats.push({ name: 'Transferred away', data: transferGraphStats[1] })
    allBasics.studentInfo.graphStats.push({ name: 'Transferred to', data: transferGraphStats[2] })
  }
  programmeData['transferred'] = programmeTableStats

  Object.keys(transferTableStats).forEach(year => {
    counts[year] = counts[year].concat(transferTableStats[year])
  })
}

const combineFacultyBasics = async (faculty, programmes, yearType, allProgrammeCodes, programmeFilter, special) => {
  let counts = {}
  let countsGraduations = {}
  let years = []
  let programmeData = {}
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = special === 'SPECIAL_INCLUDED'
  const since = isAcademicYear ? new Date('2017-08-01') : new Date('2017-01-01')
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear)
  const { graphStats, tableStats } = getStatsBasis(yearsArray)
  Object.keys(tableStats).forEach(year => years.push(year))
  const wantedProgrammeCodes = programmes.map(prog => prog.code)

  let allBasics = {
    id: faculty,
    years: [],
    programmeNames: {},
    studentInfo: {
      tableStats: [],
      graphStats: [],
      titles: includeAllSpecials
        ? ['', 'Started studying', 'Graduated', 'Transferred inside', 'Transferred away', 'Transferred to']
        : ['', 'Started studying', 'Graduated', 'Transferred inside'],
      programmeTableStats: {},
    },
    graduationInfo: {
      tableStats: [],
      graphStats: [],
      titles: ['', 'All', 'Bachelors', 'Masters', 'Doctors', 'Others'],
      programmeTableStats: {},
    },
  }
  const transfersToAwayStudyrights = await getTransferredToAndAway(wantedProgrammeCodes, allProgrammeCodes, since)
  const transferInsideStudyrights = await getTransferredInside(wantedProgrammeCodes, allProgrammeCodes, since)
  // Started studying in faculty
  await getFacultyStarters(
    faculty,
    wantedProgrammeCodes,
    transfersToAwayStudyrights,
    transferInsideStudyrights,
    since,
    isAcademicYear,
    yearsArray,
    graphStats,
    tableStats,
    counts,
    allBasics,
    programmeData,
    programmeFilter,
    includeAllSpecials
  )

  // Graduated in faculty
  await getFacultyGraduates(
    faculty,
    wantedProgrammeCodes,
    transfersToAwayStudyrights,
    transferInsideStudyrights,
    since,
    isAcademicYear,
    yearsArray,
    graphStats,
    tableStats,
    allBasics,
    counts,
    countsGraduations,
    programmeData,
    programmeFilter,
    includeAllSpecials
  )

  // Transfers
  await getFacultyTransfers(
    programmes,
    wantedProgrammeCodes,
    allProgrammeCodes,
    since,
    isAcademicYear,
    yearsArray,
    graphStats,
    tableStats,
    allBasics,
    counts,
    programmeData,
    includeAllSpecials,
    faculty
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
        graduationInfo[code][year] = [year, ...programmeData.graduated[code][year]]
      } else {
        studentInfo[code][year] = studentInfo[code][year].concat([0])
      }
      // trasferred
      if (code in programmeData.transferred) {
        studentInfo[code][year] = studentInfo[code][year].concat(programmeData.transferred[code][year])
      } else {
        if (includeAllSpecials) {
          studentInfo[code][year] = studentInfo[code][year].concat([0, 0, 0])
        } else {
          studentInfo[code][year] = studentInfo[code][year].concat([0])
        }
      }
    }
  })

  Object.keys(studentInfo).forEach(prog => {
    allBasics.studentInfo.programmeTableStats[prog] = [...Object.values(studentInfo[prog])].reverse()
  })

  Object.keys(graduationInfo).forEach(prog => {
    allBasics.graduationInfo.programmeTableStats[prog] = Object.values(graduationInfo[prog]).reverse()
  })

  return allBasics
}

module.exports = { combineFacultyBasics }
