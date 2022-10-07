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
      .filter(credit => moment(credit.attainment_date).isAfter(startDate))
      .reduce((prev, curr) => (prev += curr.credits), 0)

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

  return [data, programmeData]
}

const combineFacultyStudentProgress = async (faculty, programmes, specialGroups, graduated) => {
  const since = new Date('2017-08-01')
  const isAcademicYear = true
  const includeYearsCombined = true
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)

  let allBachelorGraphStats = getBachelorCreditGraphStats(yearsArray)
  let allBsMsGraphstats = getMasterCreditGraphStats(yearsArray)
  let allMastersGraphStats = getOnlyMasterCreditGraphStats(yearsArray)
  let allDoctoralGraphStats = getDoctoralCreditGraphStats(yearsArray)

  let bachelorsProgrammeStats = {}
  let bcMsProgrammeStats = {}
  let mastersProgrammeStats = {}
  let doctoralProgrammeStats = {}

  let bachelorsTableStats = new Array(yearsArray.length)
  let bachelorMastersTableStats = new Array(yearsArray.length)
  let mastersTableStats = new Array(yearsArray.length)
  let doctoralTableStats = new Array(yearsArray.length)

  let yearlyBachelorTitles = []
  let yearlyBcMsTitles = []
  let yearlyMasterTitles = []

  const reversedYears = [...yearsArray].reverse()
  reversedYears.forEach(year => {
    bachelorsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    bachelorMastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
    mastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0]
    doctoralTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
  })
  const limitKeys = ['zero', 't5', 't4', 't3', 't2', 't1']
  let bachelorlimits = []
  let masterlimits = []
  let bcmslimits = []
  for (const year of reversedYears) {
    const { startDate, endDate } = getAcademicYearDates(year, since)
    const today = moment()
    const lastDayOfMonth = moment(today).endOf('month')
    let months = Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(startDate))).asMonths())

    if (months >= 36) {
      bachelorlimits = [
        [Math.ceil(36 * (60 / 12)), null],
        [Math.ceil(36 * (45 / 12)), Math.ceil(36 * (60 / 12))],
        [Math.ceil(36 * (30 / 12)), Math.ceil(36 * (45 / 12))],
        [Math.ceil(36 * (15 / 12)), Math.ceil(36 * (30 / 12))],
        [1, Math.ceil(36 * (15 / 12))],
        [0, null],
      ]
    } else {
      bachelorlimits = [
        [Math.ceil(months * (60 / 12)), null],
        [Math.ceil(months * (45 / 12)), Math.ceil(months * (60 / 12))],
        [Math.ceil(months * (30 / 12)), Math.ceil(months * (45 / 12))],
        [Math.ceil(months * (15 / 12)), Math.ceil(months * (30 / 12))],
        [1, Math.ceil(months * (15 / 12))],
        [0, null],
      ]
    }
    if (months >= 20) {
      masterlimits = [
        [Math.ceil(20 * (60 / 12)), null],
        [Math.ceil(20 * (45 / 12)), Math.ceil(20 * (60 / 12))],
        [Math.ceil(20 * (30 / 12)), Math.ceil(20 * (45 / 12))],
        [Math.ceil(20 * (15 / 12)), Math.ceil(20 * (30 / 12))],
        [1, Math.ceil(20 * (15 / 12))],
        [0, null],
      ]
    } else {
      masterlimits = [
        [Math.ceil(months * (60 / 12)), null],
        [Math.ceil(months * (45 / 12)), Math.ceil(months * (60 / 12))],
        [Math.ceil(months * (30 / 12)), Math.ceil(months * (45 / 12))],
        [Math.ceil(months * (15 / 12)), Math.ceil(months * (30 / 12))],
        [1, Math.ceil(months * (15 / 12))],
        [0, null],
      ]
    }
    if (months >= 60) {
      bcmslimits = [
        [Math.ceil(60 * (60 / 12)) + 180, null],
        [Math.ceil(60 * (45 / 12)) + 180, Math.ceil(60 * (60 / 12)) + 180],
        [Math.ceil(60 * (30 / 12)) + 180, Math.ceil(60 * (45 / 12)) + 180],
        [Math.ceil(60 * (15 / 12)) + 180, Math.ceil(60 * (30 / 12)) + 180],
        [181, Math.ceil(60 * (15 / 12)) + 180],
        [180, null],
      ]
    } else {
      bcmslimits = [
        [Math.ceil(months * (60 / 12)) + 180, null],
        [Math.ceil(months * (45 / 12)) + 180, Math.ceil(months * (60 / 12)) + 180],
        [Math.ceil(months * (30 / 12)) + 180, Math.ceil(months * (45 / 12)) + 180],
        [Math.ceil(months * (15 / 12)) + 180, Math.ceil(months * (30 / 12)) + 180],
        [181, Math.ceil(months * (15 / 12)) + 180],
        [180, null],
      ]
    }

    yearlyBachelorTitles.push([
      '0 Credits',
      `${bachelorlimits[4][0]} ≤ Credits < ${bachelorlimits[4][1]}`,
      `${bachelorlimits[3][0]} ≤ Credits < ${bachelorlimits[3][1]}`,
      `${bachelorlimits[2][0]} ≤ Credits < ${bachelorlimits[2][1]}`,
      `${bachelorlimits[1][0]} ≤ Credits < ${bachelorlimits[1][1]}`,
      `${bachelorlimits[0][0]} ≤ Credits`,
    ])
    yearlyMasterTitles.push([
      '0 Credits',
      `${masterlimits[4][0]} ≤ Credits < ${masterlimits[4][1]}`,
      `${masterlimits[3][0]} ≤ Credits < ${masterlimits[3][1]}`,
      `${masterlimits[2][0]} ≤ Credits < ${masterlimits[2][1]}`,
      `${masterlimits[1][0]} ≤ Credits < ${masterlimits[1][1]}`,
      `${masterlimits[0][0]} ≤ Credits`,
    ])
    yearlyBcMsTitles.push([
      '180 Credits',
      `${bcmslimits[4][0]} ≤ Credits < ${bcmslimits[4][1]}`,
      `${bcmslimits[3][0]} ≤ Credits < ${bcmslimits[3][1]}`,
      `${bcmslimits[2][0]} ≤ Credits < ${bcmslimits[2][1]}`,
      `${bcmslimits[1][0]} ≤ Credits < ${bcmslimits[1][1]}`,
      `${bcmslimits[0][0]} ≤ Credits`,
    ])
    for (const programme of programmes) {
      let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(programme.code)
      if (!creditThresholdKeys) return
      const studentnumbers = await getCorrectStudentnumbers({
        codes: [programme.code],
        startDate,
        endDate,
        includeAllSpecials,
        includeGraduated,
      })

      const all = await allStudyrights(programme.code, studentnumbers)
      const students = await studytrackStudents(studentnumbers)

      if (programme.code.includes('KH')) {
        const data = getStudentData(
          startDate,
          students,
          creditThresholdKeys,
          creditThresholdAmounts,
          bachelorlimits,
          limitKeys,
          'KH'
        )
        const studentData = data[0]
        const programmeData = data[1]
        if (!(programme.code in bachelorsProgrammeStats)) {
          bachelorsProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        bachelorsTableStats[indexOf(reversedYears, year)][1] += all.length || 0
        if (year !== 'Total') {
          bachelorsProgrammeStats[programme.code][indexOf(reversedYears, year)] = limitKeys.map(
            key => programmeData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          bachelorsTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            studentData[key] || 0
          allBachelorGraphStats[key].data[indexOf(yearsArray, year)] += studentData[key] || 0
        }
      } else if (programme.code.includes('MH')) {
        const all_BcMs = all.filter(sr => sr.studyrightid.slice(-2) === '-2')
        const all_Ms = all.filter(sr => sr.studyrightid.slice(-2) !== '-2')
        const all_MsStudentnumbers = all_Ms.map(sr => sr.studentnumber)
        const all_BcMsStudentnumbers = all_BcMs.map(sr => sr.studentnumber)
        mastersTableStats[indexOf(reversedYears, year)][1] += all_Ms.length || 0
        bachelorMastersTableStats[indexOf(reversedYears, year)][1] += all_BcMs.length || 0

        const msStudents = students.filter(student => all_MsStudentnumbers.includes(student.studentnumber))
        const bcMsStudents = students.filter(student => all_BcMsStudentnumbers.includes(student.studentnumber))

        const data = getStudentData(
          startDate,
          bcMsStudents,
          creditThresholdKeys,
          creditThresholdAmounts,
          bcmslimits,
          limitKeys,
          'MH'
        )
        const bcMsStudentdata = data[0]
        const bcMsProgrammedata = data[1]
        const { msOnlyCreditThresholdKeys, msOnlyCreditThresholdAmount } = getOnlyMasterThresholds()
        const data2 = getStudentData(
          startDate,
          msStudents,
          msOnlyCreditThresholdKeys,
          msOnlyCreditThresholdAmount,
          masterlimits,
          limitKeys,
          'MH'
        )
        const msStudentdata = data2[0]
        const msProgrammedata = data2[1]

        if (!(programme.code in mastersProgrammeStats)) {
          mastersProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (!(programme.code in bcMsProgrammeStats)) {
          bcMsProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          mastersProgrammeStats[programme.code][indexOf(reversedYears, year)] = limitKeys.map(
            key => msProgrammedata[key]
          )
          bcMsProgrammeStats[programme.code][indexOf(reversedYears, year)] = limitKeys.map(
            key => bcMsProgrammedata[key]
          )
        }

        for (const key of Object.keys(msStudentdata)) {
          mastersTableStats[indexOf(reversedYears, year)][indexOf(msOnlyCreditThresholdKeys, key) + 2] +=
            msStudentdata[key] || 0
          allMastersGraphStats[key].data[indexOf(yearsArray, year)] += msStudentdata[key] || 0
        }
        for (const key of Object.keys(bcMsStudentdata)) {
          bachelorMastersTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            bcMsStudentdata[key] || 0
          allBsMsGraphstats[key].data[indexOf(yearsArray, year)] += bcMsStudentdata[key] || 0
        }
      } else {
        const data = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts, [], [], 'T')
        const studentData = data[0]
        doctoralTableStats[indexOf(reversedYears, year)][1] += all.length || 0
        if (!(programme.code in doctoralProgrammeStats)) {
          doctoralProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          doctoralProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => studentData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          doctoralTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            studentData[key] || 0
          allDoctoralGraphStats[key].data[indexOf(yearsArray, year)] += studentData[key] || 0
        }
      }
    }
  }

  const facultyProgressStats = {
    id: faculty,
    years: yearsArray,
    bachelorsTableStats: bachelorsTableStats,
    bcMsTableStats: bachelorMastersTableStats,
    mastersTableStats: mastersTableStats,
    doctoralTableStats: doctoralTableStats,
    bachelorsGraphStats: allBachelorGraphStats,
    bcMsGraphStats: allBsMsGraphstats,
    mastersGraphStats: allMastersGraphStats,
    doctoralGraphStats: allDoctoralGraphStats,
    bachelorTitles: tableTitles.creditProgress.bachelor,
    bcMsTitles: tableTitles.creditProgress.master,
    mastersTitles: tableTitles.creditProgress.masterOnly,
    doctoralTitles: tableTitles.creditProgress.doctoral,
    yearlyBachelorTitles: yearlyBachelorTitles,
    yearlyBcMsTitles: yearlyBcMsTitles,
    yearlyMasterTitles: yearlyMasterTitles,
    programmeNames: programmes.reduce((obj, dataItem) => ({ ...obj, [dataItem.code]: dataItem.name }), {}),
    bachelorsProgrammeStats: bachelorsProgrammeStats,
    bcMsProgrammeStats: bcMsProgrammeStats,
    mastersProgrammeStats: mastersProgrammeStats,
    doctoralProgrammeStats: doctoralProgrammeStats,
  }
  return facultyProgressStats
}
module.exports = { combineFacultyStudentProgress }
