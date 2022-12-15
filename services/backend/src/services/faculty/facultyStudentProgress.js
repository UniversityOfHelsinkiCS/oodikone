const { indexOf } = require('lodash')
const moment = require('moment')
const { getAcademicYearDates } = require('../../util/semester')
const {
  getCreditThresholds,
  getBachelorCreditGraphStats,
  getMasterCreditGraphStats,
  getDoctoralCreditGraphStats,
  getYearsArray,
  tableTitles,
  getOnlyMasterCreditGraphStats,
  getOnlyMasterThresholds,
  getVetenaryCreditGraphStats,
} = require('../studyprogrammeHelpers')
const { studytrackStudents } = require('../studyprogramme')
const { getStudyRightsByExtent, getTransferredInside, getTransferredToAndAway } = require('./faculty')
const { checkTransfers } = require('./facultyHelpers')

const getStudentData = (
  startDate,
  students,
  thresholdKeys,
  thresholdAmounts,
  limits,
  limitKeys,
  prog,
  earlyStudyRights = []
) => {
  let data = {}
  let programmeData = {}
  let start = startDate
  thresholdKeys.forEach(t => (data[t] = 0))
  limitKeys.forEach(t => (programmeData[t] = 0))
  students.forEach(({ studentnumber, credits }) => {
    if (earlyStudyRights.length > 0) {
      const bcStudyright = earlyStudyRights.filter(sr => sr.studentnumber === studentnumber)
      start = bcStudyright.length > 0 ? bcStudyright[0].startdate : startDate
    }
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isSameOrAfter(start))
      .reduce((prev, curr) => prev + curr.credits, 0)

    data[thresholdKeys[0]] += creditcount < thresholdAmounts[0] ? 1 : 0
    data[thresholdKeys[1]] += creditcount >= thresholdAmounts[0] && creditcount < thresholdAmounts[1] ? 1 : 0
    data[thresholdKeys[2]] += creditcount >= thresholdAmounts[1] && creditcount < thresholdAmounts[2] ? 1 : 0
    data[thresholdKeys[3]] += creditcount >= thresholdAmounts[2] && creditcount < thresholdAmounts[3] ? 1 : 0
    data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
    if (thresholdKeys.length === 8) {
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] && creditcount < thresholdAmounts[6] ? 1 : 0
      data[thresholdKeys[7]] += creditcount >= thresholdAmounts[6] ? 1 : 0
    } else if (thresholdKeys.length === 7) {
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] ? 1 : 0
    } else {
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] ? 1 : 0
    }
    if (['KH', 'MH'].includes(prog)) {
      programmeData[limitKeys[0]] += creditcount <= limits[5][0] ? 1 : 0
      programmeData[limitKeys[1]] += limits[4][0] <= creditcount && limits[4][1] > creditcount ? 1 : 0
      programmeData[limitKeys[2]] += limits[3][0] <= creditcount && limits[3][1] > creditcount ? 1 : 0
      programmeData[limitKeys[3]] += limits[2][0] <= creditcount && limits[2][1] > creditcount ? 1 : 0
      programmeData[limitKeys[4]] += limits[1][0] <= creditcount && limits[1][1] > creditcount ? 1 : 0
      programmeData[limitKeys[5]] += creditcount >= limits[0][0] ? 1 : 0
    }
  })

  return { data, programmeData }
}

const createLimits = (months, creditsToAdd) => {
  return [
    [Math.ceil(months * (60 / 12)) + creditsToAdd, null],
    [Math.ceil(months * (45 / 12)) + creditsToAdd, Math.ceil(months * (60 / 12)) + creditsToAdd],
    [Math.ceil(months * (30 / 12)) + creditsToAdd, Math.ceil(months * (45 / 12)) + creditsToAdd],
    [Math.ceil(months * (15 / 12)) + creditsToAdd, Math.ceil(months * (30 / 12)) + creditsToAdd],
    [creditsToAdd + 1, Math.ceil(months * (15 / 12)) + creditsToAdd],
    [creditsToAdd, null],
  ]
}

const createYearlyTitles = (start, limitList) => {
  return [
    `${start} Credits`,
    `${limitList[4][0]} ≤ Credits < ${limitList[4][1]}`,
    `${limitList[3][0]} ≤ Credits < ${limitList[3][1]}`,
    `${limitList[2][0]} ≤ Credits < ${limitList[2][1]}`,
    `${limitList[1][0]} ≤ Credits < ${limitList[1][1]}`,
    `${limitList[0][0]} ≤ Credits`,
  ]
}

const filterOutTransfers = async (studyrights, programmes, allProgrammeCodes, since) => {
  const transferredInAndOut = await getTransferredToAndAway(programmes, allProgrammeCodes, since)
  const insideTransfers = await getTransferredInside(programmes, allProgrammeCodes, since)
  const filteredStudyrights = studyrights.filter(sr => !checkTransfers(sr, insideTransfers, transferredInAndOut))
  return filteredStudyrights
}

const combineFacultyStudentProgress = async (faculty, programmes, allProgrammeCodes, specialGroups, graduated) => {
  const since = new Date('2017-08-01')
  const isAcademicYear = true
  const includeYearsCombined = true
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const graduationStatus = [0]
  if (includeGraduated) {
    graduationStatus.push(1)
  }
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)
  const titlesVet = [
    '',
    'All',
    '< 210 credits',
    '210-239 credits',
    '240-269 credits',
    '270-299 credits',
    '300-329 credits',
    '330-359 credits',
    ' 360 ≤ credits ',
  ]
  const progressStats = {
    id: faculty,
    years: yearsArray,
    bachelorsTableStats: new Array(yearsArray.length),
    bcMsTableStats: new Array(yearsArray.length),
    mastersTableStats: new Array(yearsArray.length),
    doctoralTableStats: new Array(yearsArray.length),
    bachelorsGraphStats: getBachelorCreditGraphStats(yearsArray),
    bcMsGraphStats: faculty === 'H90' ? getVetenaryCreditGraphStats(yearsArray) : getMasterCreditGraphStats(yearsArray),
    mastersGraphStats: getOnlyMasterCreditGraphStats(yearsArray),
    doctoralGraphStats: getDoctoralCreditGraphStats(yearsArray),
    bachelorTitles: tableTitles.creditProgress.bachelor,
    bcMsTitles: faculty === 'H90' ? titlesVet : tableTitles.creditProgress.master,
    mastersTitles: tableTitles.creditProgress.masterOnly,
    doctoralTitles: tableTitles.creditProgress.doctoral,
    yearlyBachelorTitles: [],
    yearlyBcMsTitles: [],
    yearlyMasterTitles: [],
    programmeNames: programmes.reduce(
      (obj, dataItem) => ({ ...obj, [dataItem.progId]: { code: dataItem.code, ...dataItem.name } }),
      {}
    ),
    bachelorsProgrammeStats: {},
    bcMsProgrammeStats: {},
    mastersProgrammeStats: {},
    doctoralProgrammeStats: {},
  }

  const reversedYears = [...yearsArray].reverse()
  reversedYears.forEach(year => {
    progressStats.bachelorsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    progressStats.bcMsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
    progressStats.mastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0]
    progressStats.doctoralTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
  })
  const limitKeys = ['zero', 't5', 't4', 't3', 't2', 't1']
  let bachelorlimits = []
  let masterlimits = []
  let bcmslimits = []
  for (const year of reversedYears) {
    const { startDate, endDate } = getAcademicYearDates(year, since)
    const lastDayOfMonth = moment().endOf('month')
    let months = Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(startDate))).asMonths())

    if (months >= 36) {
      bachelorlimits = createLimits(36, 0)
    } else {
      bachelorlimits = createLimits(months, 0)
    }
    if (months >= 24) {
      masterlimits = createLimits(24, 0)
    } else {
      masterlimits = createLimits(months, 0)
    }
    if (months >= 72 && faculty === 'H90') {
      bcmslimits = createLimits(72, 180)
    } else if (months >= 60) {
      bcmslimits = createLimits(60, 180)
    } else {
      bcmslimits = createLimits(months, 180)
    }
    progressStats.yearlyBachelorTitles = [...progressStats.yearlyBachelorTitles, createYearlyTitles(0, bachelorlimits)]
    progressStats.yearlyMasterTitles = [...progressStats.yearlyMasterTitles, createYearlyTitles(0, masterlimits)]
    progressStats.yearlyBcMsTitles = [...progressStats.yearlyBcMsTitles, createYearlyTitles(180, bcmslimits)]
    const programmeCodes = programmes.map(prog => prog.code)

    for (const { progId, code } of programmes) {
      let extentcodes = []
      if (includeAllSpecials) {
        extentcodes = [7, 9, 34, 22, 99, 14, 13]
      }
      let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(code)
      if (!creditThresholdKeys) return

      if (code.includes('KH')) {
        extentcodes.push(1)
        let studyrights = await getStudyRightsByExtent(faculty, startDate, endDate, code, extentcodes, graduationStatus)
        if (!includeAllSpecials) {
          studyrights = await filterOutTransfers(studyrights, programmeCodes, allProgrammeCodes, since)
        }
        const all = studyrights
          .filter(sr => sr.studyrightElements.some(element => element.code === code))
          .map(sr => sr.studentnumber)
        const students = await studytrackStudents(all)
        const { data: studentData, programmeData } = getStudentData(
          startDate,
          students,
          creditThresholdKeys,
          creditThresholdAmounts,
          bachelorlimits,
          limitKeys,
          'KH'
        )

        if (!(progId in progressStats.bachelorsProgrammeStats)) {
          progressStats.bachelorsProgrammeStats[progId] = new Array(reversedYears.length - 1)
        }
        progressStats.bachelorsTableStats[indexOf(reversedYears, year)][1] += all.length || 0
        if (year !== 'Total') {
          progressStats.bachelorsProgrammeStats[progId][indexOf(reversedYears, year)] = limitKeys.map(
            key => programmeData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          progressStats.bachelorsTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            studentData[key] || 0
          progressStats.bachelorsGraphStats[key].data[indexOf(yearsArray, year)] += studentData[key] || 0
        }
      } else if (code.includes('MH')) {
        extentcodes.push(2)
        let all = await getStudyRightsByExtent(faculty, startDate, endDate, code, extentcodes, graduationStatus)
        if (!includeAllSpecials) {
          all = await filterOutTransfers(all, programmeCodes, allProgrammeCodes, since)
        }
        const allMsStudents = all.filter(sr => sr.studyrightid.slice(-2) !== '-2').map(sr => sr.studentnumber)
        const allBcMsStudents = all.filter(sr => sr.studyrightid.slice(-2) === '-2').map(sr => sr.studentnumber)
        const studentsWithBachelor = all
          .filter(sr => sr.studyrightid.slice(-2) === '-2')
          .map(sr => ({ studentnumber: sr.studentnumber, startdate: sr.startdate }))
        const bcMsStudents = await studytrackStudents(allBcMsStudents)
        const msStudents = await studytrackStudents(allMsStudents)

        progressStats.mastersTableStats[indexOf(reversedYears, year)][1] += allMsStudents.length || 0
        progressStats.bcMsTableStats[indexOf(reversedYears, year)][1] += allBcMsStudents.length || 0
        const { data: bcMsStudentdata, programmeData: bcMsProgrammedata } = getStudentData(
          startDate,
          bcMsStudents,
          creditThresholdKeys,
          creditThresholdAmounts,
          bcmslimits,
          limitKeys,
          'MH',
          studentsWithBachelor
        )
        const { msOnlyCreditThresholdKeys, msOnlyCreditThresholdAmount } = getOnlyMasterThresholds()
        const { data: msStudentdata, programmeData: msProgrammedata } = getStudentData(
          startDate,
          msStudents,
          msOnlyCreditThresholdKeys,
          msOnlyCreditThresholdAmount,
          masterlimits,
          limitKeys,
          'MH'
        )
        if (!(progId in progressStats.mastersProgrammeStats)) {
          progressStats.mastersProgrammeStats[progId] = new Array(reversedYears.length - 1)
        }
        if (!(progId in progressStats.bcMsProgrammeStats)) {
          progressStats.bcMsProgrammeStats[progId] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          progressStats.mastersProgrammeStats[progId][indexOf(reversedYears, year)] = limitKeys.map(
            key => msProgrammedata[key]
          )
          progressStats.bcMsProgrammeStats[progId][indexOf(reversedYears, year)] = limitKeys.map(
            key => bcMsProgrammedata[key]
          )
        }
        for (const key of Object.keys(msStudentdata)) {
          progressStats.mastersTableStats[indexOf(reversedYears, year)][indexOf(msOnlyCreditThresholdKeys, key) + 2] +=
            msStudentdata[key] || 0
          progressStats.mastersGraphStats[key].data[indexOf(yearsArray, year)] += msStudentdata[key] || 0
        }
        for (const key of Object.keys(bcMsStudentdata)) {
          progressStats.bcMsTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            bcMsStudentdata[key] || 0
          progressStats.bcMsGraphStats[key].data[indexOf(yearsArray, year)] += bcMsStudentdata[key] || 0
        }
      } else {
        extentcodes.push(4)
        let studyrights = await getStudyRightsByExtent(faculty, startDate, endDate, code, extentcodes, graduationStatus)
        if (!includeAllSpecials) {
          studyrights = await filterOutTransfers(studyrights, programmeCodes, allProgrammeCodes, since)
        }
        const all = studyrights
          .filter(sr => sr.studyrightElements.some(element => element.code === code))
          .map(sr => sr.studentnumber)
        const students = await studytrackStudents(all)
        const { data } = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts, [], [], 'T')
        progressStats.doctoralTableStats[indexOf(reversedYears, year)][1] += all.length || 0
        if (!(progId in progressStats.doctoralProgrammeStats)) {
          progressStats.doctoralProgrammeStats[progId] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          progressStats.doctoralProgrammeStats[progId][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => data[key]
          )
        }
        for (const key of Object.keys(data)) {
          progressStats.doctoralTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            data[key] || 0
          progressStats.doctoralGraphStats[key].data[indexOf(yearsArray, year)] += data[key] || 0
        }
      }
    }
  }

  return progressStats
}
module.exports = { combineFacultyStudentProgress }
