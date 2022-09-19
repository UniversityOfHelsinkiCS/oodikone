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
    bachelorTitles: [
      '',
      'All',
      '< 15 credits',
      '15-30 credits',
      '30-59 credits',
      '60-89 credits',
      '90-119 credits',
      '120-149 credits',
      '150-179 credits',
      '> 180 credits',
    ],
    mastersTitles: [
      '',
      'All',
      '< 200 credits',
      '200-219 credits',
      '220-239 credits',
      '240-259 credits',
      '260-279 credits',
      '280-299 credits',
      '> 300 credits',
    ],
    doctoralTitles: [
      '',
      'All',
      '< 50 credits',
      '50-99 credits',
      '100-149 credits',
      '150-199 credits',
      '200-249 credits',
      '250-299 credits',
      '> 300 credits',
    ],
    programmeNames: programmes.data.reduce((obj, dataItem) => ({ ...obj, [dataItem.code]: dataItem.name }), {}),
    bachelorsProgrammeStats: {},
    mastersProgrammeStats: {},
    doctoralProgrammeStats: {},
  }

  const bachelorstats = getBachelorCreditGraphStats(yearsArray)
  let allBachelorGraphStats = {
    lte15: {
      name: 'Less than 15 credits',
      data: new Array(yearsArray.length).fill(0),
    },
    ...bachelorstats,
  }
  let allMastersGraphStats = getMasterCreditGraphStats(yearsArray)
  let allDoctoralGraphStats = getDoctoralCreditGraphStats(yearsArray)

  let bachelorsProgrammeStats = {}
  let mastersProgrammeStats = {}
  let doctoralProgrammeStats = {}
  let bachelorsTableStats = new Array(yearsArray.length)
  let mastersTableStats = new Array(yearsArray.length)
  let doctoralTableStats = new Array(yearsArray.length)

  // eslint-disable-next-line no-unused-vars
  const reversedYears = [...yearsArray].reverse()
  for (const programme of programmes.data) {
    let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(programme.code)
    if (!creditThresholdKeys) return
    if (programme.code.includes('KH')) {
      creditThresholdKeys = ['lte15', ...creditThresholdKeys]
      creditThresholdAmounts = [15, ...creditThresholdAmounts]
    }

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
      if (programme.code.includes('KH')) {
        if (!(programme.code in bachelorsProgrammeStats)) {
          bachelorsProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }

        const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
        bachelorsTableStats[indexOf(reversedYears, year)] = [
          year,
          all.length,
          ...creditThresholdKeys.map(key => studentData[key]),
        ]

        if (year !== 'Total') {
          bachelorsProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => studentData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          allBachelorGraphStats[key].data[indexOf(yearsArray, year)] = studentData[key]
        }
      } else if (programme.code.includes('MH')) {
        const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
        mastersTableStats[indexOf(reversedYears, year)] = [
          year,
          all.length,
          ...creditThresholdKeys.map(key => studentData[key]),
        ]
        if (!(programme.code in mastersProgrammeStats)) {
          mastersProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          mastersProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => studentData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          allMastersGraphStats[key].data[indexOf(yearsArray, year)] = studentData[key]
        }
      } else {
        const studentData = getStudentData(startDate, students, creditThresholdKeys, creditThresholdAmounts)
        doctoralTableStats[indexOf(reversedYears, year)] = [
          year,
          all.length,
          ...creditThresholdKeys.map(key => studentData[key]),
        ]
        if (!(programme.code in doctoralProgrammeStats)) {
          doctoralProgrammeStats[programme.code] = new Array(reversedYears.length - 1)
        }
        if (year !== 'Total') {
          doctoralProgrammeStats[programme.code][indexOf(reversedYears, year)] = creditThresholdKeys.map(
            key => studentData[key]
          )
        }
        for (const key of Object.keys(studentData)) {
          allDoctoralGraphStats[key].data[indexOf(yearsArray, year)] = studentData[key]
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
