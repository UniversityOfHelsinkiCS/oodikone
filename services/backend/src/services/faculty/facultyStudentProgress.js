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

const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts) => {
  let data = {}
  thresholdKeys.forEach(t => (data[t] = 0))

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
  })
  return data
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

  const reversedYears = [...yearsArray].reverse()
  reversedYears.forEach(year => {
    bachelorsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    bachelorMastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
    mastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0]
    doctoralTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
  })

  for (const programme of programmes) {
    let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(programme.code)
    if (!creditThresholdKeys) return

    for (const year of reversedYears) {
      const { startDate, endDate } = getAcademicYearDates(year, since)
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
        const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
        if (!(programme.code in bachelorsProgrammeStats)) {
          bachelorsProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        bachelorsTableStats[indexOf(reversedYears, year)][1] += all.length || 0
        if (year !== 'Total') {
          bachelorsProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => studentData[key]
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

        const bcMsStudentdata = getStudentData(startDate, bcMsStudents, creditThresholdKeys, creditThresholdAmounts)
        const { msOnlyCreditThresholdKeys, msOnlyCreditThresholdAmount } = getOnlyMasterThresholds()
        const msStudentdata = getStudentData(
          startDate,
          msStudents,
          msOnlyCreditThresholdKeys,
          msOnlyCreditThresholdAmount
        )

        if (!(programme.code in mastersProgrammeStats)) {
          mastersProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (!(programme.code in bcMsProgrammeStats)) {
          bcMsProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          mastersProgrammeStats[programme.code][indexOf(reversedYears, year)] = msOnlyCreditThresholdKeys.map(
            key => msStudentdata[key]
          )
          bcMsProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => bcMsStudentdata[key]
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
        const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
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
    programmeNames: programmes.reduce((obj, dataItem) => ({ ...obj, [dataItem.code]: dataItem.name }), {}),
    bachelorsProgrammeStats: bachelorsProgrammeStats,
    bcMsProgrammeStats: bcMsProgrammeStats,
    mastersProgrammeStats: mastersProgrammeStats,
    doctoralProgrammeStats: doctoralProgrammeStats,
  }
  return facultyProgressStats
}
module.exports = { combineFacultyStudentProgress }
