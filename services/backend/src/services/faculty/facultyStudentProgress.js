const { indexOf } = require('lodash')
const moment = require('moment')
const { getAcademicYearDates } = require('../../util/semester')
const {
  getCreditThresholds,
  getBachelorCreditGraphStats,
  getMasterCreditGraphStats,
  getDoctoralCreditGraphStats,
  getYearsArray,
  getCorrectStudentnumbers,
  tableTitles,
  getOnlyMasterCreditGraphStats,
  getOnlyMasterThresholds,
} = require('../studyprogrammeHelpers')
const { studytrackStudents, allStudyrights } = require('../studyprogramme')

const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts, limits, limitKeys, prog) => {
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

const combineFacultyStudentProgress = async (faculty, programmes, specialGroups, graduated) => {
  const since = new Date('2017-08-01')
  const isAcademicYear = true
  const includeYearsCombined = true
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)

  const progressStats = {
    id: faculty,
    years: yearsArray,
    bachelorsTableStats: new Array(yearsArray.length),
    bcMsTableStats: new Array(yearsArray.length),
    mastersTableStats: new Array(yearsArray.length),
    doctoralTableStats: new Array(yearsArray.length),
    bachelorsGraphStats: getBachelorCreditGraphStats(yearsArray),
    bcMsGraphStats: getMasterCreditGraphStats(yearsArray),
    mastersGraphStats: getOnlyMasterCreditGraphStats(yearsArray),
    doctoralGraphStats: getDoctoralCreditGraphStats(yearsArray),
    bachelorTitles: tableTitles.creditProgress.bachelor,
    bcMsTitles: tableTitles.creditProgress.master,
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
    progressStats.yearlyMasterTitles = [...progressStats.yearlyMasterTitles, createYearlyTitles(0, bachelorlimits)]
    progressStats.yearlyBcMsTitles = [...progressStats.yearlyBcMsTitles, createYearlyTitles(0, bachelorlimits)]

    for (const { progId, code } of programmes) {
      let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(code)
      if (!creditThresholdKeys) return
      const studentnumbers = await getCorrectStudentnumbers({
        codes: [code],
        startDate,
        endDate,
        includeAllSpecials,
        includeGraduated,
      })

      const all = await allStudyrights(code, studentnumbers)
      const students = await studytrackStudents(studentnumbers)

      if (code.includes('KH')) {
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
        const all_BcMs = all.filter(sr => sr.studyrightid.slice(-2) === '-2')
        const all_Ms = all.filter(sr => sr.studyrightid.slice(-2) !== '-2')
        const all_MsStudentnumbers = all_Ms.map(sr => sr.studentnumber)
        const all_BcMsStudentnumbers = all_BcMs.map(sr => sr.studentnumber)
        progressStats.mastersTableStats[indexOf(reversedYears, year)][1] += all_Ms.length || 0
        progressStats.bcMsTableStats[indexOf(reversedYears, year)][1] += all_BcMs.length || 0

        const msStudents = students.filter(student => all_MsStudentnumbers.includes(student.studentnumber))
        const bcMsStudents = students.filter(student => all_BcMsStudentnumbers.includes(student.studentnumber))

        const { data: bcMsStudentdata, programmeData: bcMsProgrammedata } = getStudentData(
          startDate,
          bcMsStudents,
          creditThresholdKeys,
          creditThresholdAmounts,
          bcmslimits,
          limitKeys,
          'MH'
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
