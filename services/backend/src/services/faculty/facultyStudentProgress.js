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
} = require('../studyprogrammeHelpers')
const { studytrackStudents, allStudyrights } = require('../studyprogramme')

const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts, studentStats = false) => {
  let data = {}
  if (studentStats) {
    data = { female: 0, male: 0, finnish: 0 }
  }
  thresholdKeys.forEach(t => (data[t] = 0))

  students.forEach(({ gender_code, home_country_en, credits }) => {
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isAfter(startDate))
      .reduce((prev, curr) => (prev += curr.credits), 0)

    if (studentStats) {
      data.male += gender_code === '1' ? 1 : 0
      data.female += gender_code === '2' ? 1 : 0
      data.finnish += home_country_en === 'Finland' ? 1 : 0
    }
    data[thresholdKeys[0]] += creditcount < thresholdAmounts[0] ? 1 : 0
    data[thresholdKeys[1]] += creditcount >= thresholdAmounts[0] && creditcount < thresholdAmounts[1] ? 1 : 0
    data[thresholdKeys[2]] += creditcount >= thresholdAmounts[1] && creditcount < thresholdAmounts[2] ? 1 : 0
    data[thresholdKeys[3]] += creditcount >= thresholdAmounts[2] && creditcount < thresholdAmounts[3] ? 1 : 0
    data[thresholdKeys[4]] += creditcount >= thresholdAmounts[3] && creditcount < thresholdAmounts[4] ? 1 : 0
    data[thresholdKeys[5]] += creditcount >= thresholdAmounts[4] && creditcount < thresholdAmounts[5] ? 1 : 0
    if (thresholdKeys.length > 7) {
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] && creditcount < thresholdAmounts[6] ? 1 : 0
      data[thresholdKeys[7]] += creditcount >= thresholdAmounts[6] ? 1 : 0
    } else {
      data[thresholdKeys[6]] += creditcount >= thresholdAmounts[5] ? 1 : 0
    }
  })
  return data
}

const getFacultyStudentProgress = async (faculty, programmes) => {
  const since = new Date('2017-08-01')
  const isAcademicYear = true
  const includeYearsCombined = true
  const yearsArray = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)
  const facultyProgressStats = {
    id: faculty,
    years: yearsArray,
    bachelorsTableStats: [],
    mastersTableStats: [],
    doctoralTableStats: [],
    bachelorsGraphStats: {},
    mastersGraphStats: {},
    doctoralGraphStats: {},
    bachelorTitles: tableTitles.creditProgress.bachelor,
    mastersTitles: tableTitles.creditProgress.master,
    doctoralTitles: tableTitles.creditProgress.doctoral,
    programmeNames: programmes.data.reduce((obj, dataItem) => ({ ...obj, [dataItem.code]: dataItem.name }), {}),
    bachelorsProgrammeStats: {},
    mastersProgrammeStats: {},
    doctoralProgrammeStats: {},
  }

  let allBachelorGraphStats = getBachelorCreditGraphStats(yearsArray)
  let allMastersGraphStats = getMasterCreditGraphStats(yearsArray)
  let allDoctoralGraphStats = getDoctoralCreditGraphStats(yearsArray)

  let bachelorsProgrammeStats = {}
  let mastersProgrammeStats = {}
  let doctoralProgrammeStats = {}

  let bachelorsTableStats = new Array(yearsArray.length)
  let mastersTableStats = new Array(yearsArray.length)
  let doctoralTableStats = new Array(yearsArray.length)

  const reversedYears = [...yearsArray].reverse()
  reversedYears.forEach(year => {
    bachelorsTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    mastersTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
    doctoralTableStats[indexOf(reversedYears, year)] = [year, 0, 0, 0, 0, 0, 0, 0, 0]
  })

  for (const programme of programmes.data) {
    let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(programme.code)
    if (!creditThresholdKeys) return

    for (const year of reversedYears) {
      const { startDate, endDate } = getAcademicYearDates(year, since)
      const specialGroups = true
      const includeGraduated = true
      const studentnumbers = await getCorrectStudentnumbers({
        codes: [programme.code],
        startDate,
        endDate,
        specialGroups,
        includeGraduated,
      })

      const all = await allStudyrights(programme.code, studentnumbers)
      const students = await studytrackStudents(studentnumbers)
      const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)

      if (programme.code.includes('KH')) {
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
        mastersTableStats[indexOf(reversedYears, year)][1] += all.length || 0
        if (!(programme.code in mastersProgrammeStats)) {
          mastersProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          mastersProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => studentData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          mastersTableStats[indexOf(reversedYears, year)][indexOf(creditThresholdKeys, key) + 2] +=
            studentData[key] || 0
          allMastersGraphStats[key].data[indexOf(yearsArray, year)] += studentData[key] || 0
        }
      } else {
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
  facultyProgressStats.bachelorsTableStats = bachelorsTableStats
  facultyProgressStats.mastersTableStats = mastersTableStats
  facultyProgressStats.doctoralTableStats = doctoralTableStats

  facultyProgressStats.doctoralProgrammeStats = doctoralProgrammeStats
  facultyProgressStats.mastersProgrammeStats = mastersProgrammeStats
  facultyProgressStats.bachelorsProgrammeStats = bachelorsProgrammeStats

  facultyProgressStats.bachelorsGraphStats = allBachelorGraphStats
  facultyProgressStats.mastersGraphStats = allMastersGraphStats
  facultyProgressStats.doctoralGraphStats = allDoctoralGraphStats

  return facultyProgressStats
}
module.exports = { getFacultyStudentProgress }
