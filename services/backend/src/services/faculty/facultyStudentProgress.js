const { indexOf } = require('lodash')
const { Op } = require('sequelize')
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

const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts, limits = [], limitKeys = [], prog) => {
  let data = {}
  let programmeData = {}
  thresholdKeys.forEach(t => (data[t] = 0))
  limitKeys.forEach(t => (programmeData[t] = 0))
  students.forEach(({ credits }) => {
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isSameOrAfter(startDate))
      .reduce((prev, curr) => prev + curr.credits, 0)
    data[thresholdKeys[0]] += creditcount < thresholdAmounts[0] ? 1 : 0
    data[thresholdKeys[1]] += creditcount >= thresholdAmounts[0] && creditcount < thresholdAmounts[1] ? 1 : 0
    data[thresholdKeys[2]] += creditcount >= thresholdAmounts[1] && creditcount < thresholdAmounts[2] ? 1 : 0
    data[thresholdKeys[3]] += creditcount >= thresholdAmounts[2] && creditcount < thresholdAmounts[3] ? 1 : 0
    if (thresholdKeys.length === 8) {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] && creditcount < thresholdAmounts[6] ? 1 : 0
      data[thresholdKeys[7]] += creditcount >= thresholdAmounts[6] ? 1 : 0
    } else if (thresholdKeys.length === 7) {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] ? 1 : 0
    } else if (thresholdKeys.length === 6) {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
      data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] ? 1 : 0
    } else {
      data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] ? 1 : 0
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

  return { data, progData: programmeData }
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
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const graduationStatus = [0]
  if (includeGraduated) {
    graduationStatus.push(1)
  }
  const yearsArray = getYearsArray(since.getFullYear(), true, true)
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
    programmeNames: {},
    bachelorsProgStats: {},
    bcMsProgStats: {},
    mastersProgStats: {},
    doctoralProgStats: {},
  }

  const reversedYears = [...yearsArray].reverse()
  reversedYears.forEach(year => {
    progressStats.bachelorsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    progressStats.bcMsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
    progressStats.mastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0]
    progressStats.doctoralTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0]
  })
  const limitKeys = ['zero', 't5', 't4', 't3', 't2', 't1']
  let bachelorlimits = []
  let masterlimits = []
  let bcmslimits = []
  const bachelorProgress = {}
  const masterProgress = {}
  const bcmsProgress = {}
  const doctoralProgress = {}
  for (const year of reversedYears) {
    if (year === 'Total') continue
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
      bcmslimits = createLimits(72, 0)
    } else if (months >= 60) {
      bcmslimits = createLimits(60, 0)
    } else {
      bcmslimits = createLimits(months, 0)
    }
    progressStats.yearlyBachelorTitles = [...progressStats.yearlyBachelorTitles, createYearlyTitles(0, bachelorlimits)]
    progressStats.yearlyMasterTitles = [...progressStats.yearlyMasterTitles, createYearlyTitles(0, masterlimits)]
    progressStats.yearlyBcMsTitles = [...progressStats.yearlyBcMsTitles, createYearlyTitles(0, bcmslimits)]
    const programmeCodes = programmes.map(prog => prog.code)

    for (const { progId, code, name } of programmes) {
      let extentcodes = [1, 2, 3, 4]
      if (includeAllSpecials) {
        extentcodes = [...extentcodes, ...[7, 9, 34, 22, 99, 14, 13]]
      }
      const startDateWhere = {
        startdate: {
          [Op.and]: {
            [Op.gte]: startDate,
            [Op.lte]: endDate,
          },
        },
      }
      let studyrights = await getStudyRightsByExtent(faculty, {}, startDateWhere, code, extentcodes, graduationStatus)
      let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(code)
      if (!creditThresholdKeys) continue
      if (!(progId in progressStats.programmeNames)) {
        progressStats.programmeNames[progId] = { code: code, ...name }
      }
      if (!includeAllSpecials) {
        studyrights = await filterOutTransfers(studyrights, programmeCodes, allProgrammeCodes, since)
      }
      if (code.includes('KH')) {
        const allBachelors = studyrights.filter(sr => sr.extentcode === 1).map(sr => sr.studentnumber)
        const students = await studytrackStudents(allBachelors)
        const { data: studentData, progData } = getStudentData(
          startDate,
          students,
          creditThresholdKeys,
          creditThresholdAmounts,
          bachelorlimits,
          limitKeys,
          'KH'
        )

        if (!(progId in bachelorProgress)) {
          bachelorProgress[progId] = new Array(reversedYears.length - 1)
        }
        progressStats.bachelorsTableStats[indexOf(reversedYears, year)][1] += students.length || 0
        progressStats.bachelorsTableStats[indexOf(reversedYears, 'Total')][1] += students.length || 0
        bachelorProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => progData[key])
        for (const key of Object.keys(studentData)) {
          progressStats.bachelorsTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            studentData[key] || 0
          progressStats.bachelorsGraphStats[key].data[indexOf(yearsArray, year)] += studentData[key] || 0
          progressStats.bachelorsTableStats[indexOf(reversedYears, 'Total')][indexOf(creditThresholdKeys, key) + 2] +=
            studentData[key] || 0
          progressStats.bachelorsGraphStats[key].data[indexOf(yearsArray, 'Total')] += studentData[key] || 0
        }
      } else if (code.includes('MH')) {
        const allMsStudents = studyrights
          .filter(sr => sr.extentcode === 2 && sr.studyrightid.slice(-2) !== '-2')
          .map(sr => sr.studentnumber)
        const allBcMsStudents = studyrights
          .filter(sr => sr.extentcode === 2 && sr.studyrightid.slice(-2) === '-2')
          .map(sr => sr.studentnumber)
        const bcMsStudents = await studytrackStudents(allBcMsStudents)
        const msStudents = await studytrackStudents(allMsStudents)

        progressStats.mastersTableStats[indexOf(reversedYears, year)][1] += msStudents.length || 0
        progressStats.mastersTableStats[indexOf(reversedYears, 'Total')][1] += msStudents.length || 0
        progressStats.bcMsTableStats[indexOf(reversedYears, year)][1] += bcMsStudents.length || 0
        progressStats.bcMsTableStats[indexOf(reversedYears, 'Total')][1] += bcMsStudents.length || 0
        const { data: bcMsStudentdata, progData: bcMsProgdata } = getStudentData(
          startDate,
          bcMsStudents,
          creditThresholdKeys,
          creditThresholdAmounts,
          bcmslimits,
          limitKeys,
          'MH'
        )
        const { msOnlyCreditThresholdKeys, msOnlyCreditThresholdAmount } = getOnlyMasterThresholds()
        const { data: msStudentdata, progData: msProgdata } = getStudentData(
          startDate,
          msStudents,
          msOnlyCreditThresholdKeys,
          msOnlyCreditThresholdAmount,
          masterlimits,
          limitKeys,
          'MH'
        )
        if (!(progId in masterProgress)) {
          masterProgress[progId] = new Array(reversedYears.length - 1)
          bcmsProgress[progId] = new Array(reversedYears.length - 1)
        }

        masterProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => msProgdata[key])
        bcmsProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => bcMsProgdata[key])
        for (const key of Object.keys(msStudentdata)) {
          progressStats.mastersTableStats[indexOf(reversedYears, year)][indexOf(msOnlyCreditThresholdKeys, key) + 2] +=
            msStudentdata[key] || 0
          progressStats.mastersTableStats[indexOf(reversedYears, 'Total')][
            indexOf(msOnlyCreditThresholdKeys, key) + 2
          ] += msStudentdata[key] || 0
          progressStats.mastersGraphStats[key].data[indexOf(yearsArray, year)] += msStudentdata[key] || 0
          progressStats.mastersGraphStats[key].data[indexOf(yearsArray, 'Total')] += msStudentdata[key] || 0
        }
        for (const key of Object.keys(bcMsStudentdata)) {
          progressStats.bcMsTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            bcMsStudentdata[key] || 0
          progressStats.bcMsTableStats[indexOf(reversedYears, 'Total')][indexOf(creditThresholdKeys, key) + 2] +=
            bcMsStudentdata[key] || 0
          progressStats.bcMsGraphStats[key].data[indexOf(yearsArray, year)] += bcMsStudentdata[key] || 0
          progressStats.bcMsGraphStats[key].data[indexOf(yearsArray, 'Total')] += bcMsStudentdata[key] || 0
        }
      } else {
        const all = studyrights.filter(sr => sr.extentcode === 4 || sr.extentcode === 3).map(sr => sr.studentnumber)
        const doctoralStudents = await studytrackStudents(all)
        const { data } = getStudentData(startDate, doctoralStudents, creditThresholdKeys, creditThresholdAmounts, 'T')

        progressStats.doctoralTableStats[indexOf(reversedYears, year)][1] += doctoralStudents.length || 0
        progressStats.doctoralTableStats[indexOf(reversedYears, 'Total')][1] += doctoralStudents.length || 0
        if (!(progId in doctoralProgress)) {
          doctoralProgress[progId] = new Array(reversedYears.length - 1)
        }
        doctoralProgress[progId][indexOf(reversedYears, year)] = creditThresholdKeys.map(key => data[key])

        for (const key of Object.keys(data)) {
          progressStats.doctoralTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            data[key] || 0
          progressStats.doctoralTableStats[indexOf(reversedYears, 'Total')][indexOf(creditThresholdKeys, key) + 2] +=
            data[key] || 0
          progressStats.doctoralGraphStats[key].data[indexOf(yearsArray, year)] += data[key] || 0
          progressStats.doctoralGraphStats[key].data[indexOf(yearsArray, 'Total')] += data[key] || 0
        }
      }
    }
  }

  progressStats.bachelorsProgStats = Object.keys(bachelorProgress)
    .filter(prog => !bachelorProgress[prog].every(year => year.every(value => value === 0)))
    .reduce((result, prog) => ({ ...result, [prog]: bachelorProgress[prog] }), {})
  progressStats.mastersProgStats = Object.keys(masterProgress)
    .filter(prog => !masterProgress[prog].every(year => year.every(value => value === 0)))
    .reduce((result, prog) => ({ ...result, [prog]: masterProgress[prog] }), {})
  progressStats.bcMsProgStats = Object.keys(bcmsProgress)
    .filter(prog => !bcmsProgress[prog].every(year => year.every(value => value === 0)))
    .reduce((result, prog) => ({ ...result, [prog]: bcmsProgress[prog] }), {})
  progressStats.doctoralProgStats = Object.keys(doctoralProgress)
    .filter(prog => !doctoralProgress[prog].every(year => year.every(value => value === 0)))
    .reduce((result, prog) => ({ ...result, [prog]: doctoralProgress[prog] }), {})
  return progressStats
}
module.exports = { combineFacultyStudentProgress }
