const { indexOf } = require('lodash')
const moment = require('moment')
const { getAcademicYearDates } = require('../../util/semester')
const { getCreditThresholds, getYearsArray } = require('../studyprogrammeHelpers')
const { studytrackStudents } = require('../studyprogramme')
const { getStudyRightsByExtent, getStudyRightsByBachelorStart, getTransfersIn, getTransfersOut } = require('./faculty')
const { checkTransfers } = require('./facultyHelpers')

const getStudentData = (startDate, students, thresholdKeys, thresholdAmounts, limits = [], limitKeys = [], prog) => {
  let data = {}
  let programmeData = {}
  const creditCounts = []
  thresholdKeys.forEach(t => (data[t] = 0))
  limitKeys.forEach(t => (programmeData[t] = 0))
  students.forEach(({ credits }) => {
    const creditcount = credits
      .filter(credit => moment(credit.attainment_date).isSameOrAfter(startDate))
      .reduce((prev, curr) => prev + curr.credits, 0)
    creditCounts.push(creditcount)
    // Data is only used for doctoral programmes, otherwise only programmeData is needed
    if (prog === 'T') {
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
    } else {
      programmeData[limitKeys[0]] += creditcount <= limits[5][0] ? 1 : 0
      programmeData[limitKeys[1]] += limits[4][0] <= creditcount && limits[4][1] > creditcount ? 1 : 0
      programmeData[limitKeys[2]] += limits[3][0] <= creditcount && limits[3][1] > creditcount ? 1 : 0
      programmeData[limitKeys[3]] += limits[2][0] <= creditcount && limits[2][1] > creditcount ? 1 : 0
      programmeData[limitKeys[4]] += limits[1][0] <= creditcount && limits[1][1] > creditcount ? 1 : 0
      programmeData[limitKeys[5]] += creditcount >= limits[0][0] ? 1 : 0
    }
  })

  return { data, progData: programmeData, creditCounts }
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

const filterOutTransfers = async (studyrights, programmeCode, startDate, endDate) => {
  const transferredIn = await getTransfersIn(programmeCode, startDate, endDate)
  const transferredOut = await getTransfersOut(programmeCode, startDate, endDate)
  const filteredStudyrights = studyrights.filter(sr => !checkTransfers(sr, transferredIn, transferredOut))
  return filteredStudyrights
}

const combineFacultyStudentProgress = async (faculty, programmes, specialGroups, graduated) => {
  const since = new Date('2017-08-01')
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  let graduationStatus = [0]
  if (includeGraduated) {
    graduationStatus = [0, 1]
  }
  const yearsArray = getYearsArray(since.getFullYear(), true, true)
  const progressStats = {
    id: faculty,
    years: yearsArray,
    yearlyBachelorTitles: [],
    yearlyBcMsTitles: [],
    yearlyMasterTitles: [],
    yearlyLicentiateTitles: [],
    programmeNames: {},
    bachelorsProgStats: {},
    bcMsProgStats: {},
    mastersProgStats: {},
    doctoralProgStats: {},
    creditCounts: {
      bachelor: {},
      bachelorMaster: {},
      master: {},
      licentiate: {}, // only used for programmes MH30_001 and MH30_003
      doctor: {},
    },
  }

  const reversedYears = [...yearsArray].reverse()

  const limitKeys = ['zero', 't5', 't4', 't3', 't2', 't1']
  let bachelorlimits = []
  let masterlimits = []
  let bcmslimits = []
  let licentiatelimits = []
  const bachelorProgress = {}
  const masterProgress = {}
  const bcmsProgress = {}
  const licentiateProgress = {}
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
    if (months >= 72 && faculty === 'H30') {
      licentiatelimits = createLimits(72, 0)
    } else if (months >= 60) {
      licentiatelimits = createLimits(60, 0)
    } else {
      licentiatelimits = createLimits(months, 0)
    }
    progressStats.yearlyBachelorTitles = [...progressStats.yearlyBachelorTitles, createYearlyTitles(0, bachelorlimits)]
    progressStats.yearlyMasterTitles = [...progressStats.yearlyMasterTitles, createYearlyTitles(0, masterlimits)]
    progressStats.yearlyLicentiateTitles = [
      ...progressStats.yearlyLicentiateTitles,
      createYearlyTitles(0, licentiatelimits),
    ]
    progressStats.yearlyBcMsTitles = [...progressStats.yearlyBcMsTitles, createYearlyTitles(0, bcmslimits)]

    progressStats.creditCounts.bachelor[year] = []
    progressStats.creditCounts.bachelorMaster[year] = []
    progressStats.creditCounts.master[year] = []
    progressStats.creditCounts.licentiate[year] = []
    progressStats.creditCounts.doctor[year] = []

    for (const { progId, code, name } of programmes) {
      let extentcodes = [1, 2, 3, 4]
      if (includeAllSpecials) {
        extentcodes = [...extentcodes, ...[6, 7, 9, 13, 14, 22, 23, 34, 99]]
      }
      // For bachelor-master we want to have the start of the bachelor programme of the student.
      let studyrights = code.includes('MH')
        ? await getStudyRightsByBachelorStart(faculty, startDate, endDate, code, extentcodes, graduationStatus)
        : await getStudyRightsByExtent(faculty, startDate, endDate, code, extentcodes, graduationStatus)

      // Get credit threshold values: 'combined study programme' is false and 'only master studyright' is true
      let { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(code, false, true)

      if (!creditThresholdKeys) continue
      if (!(progId in progressStats.programmeNames)) {
        progressStats.programmeNames[progId] = { code: code, ...name }
      }
      if (!includeAllSpecials) {
        studyrights = await filterOutTransfers(studyrights, code, startDate, endDate)
      }
      if (code.includes('KH')) {
        const allBachelors = studyrights.filter(sr => sr.extentcode === 1).map(sr => sr.studentnumber)
        const students = await studytrackStudents(allBachelors)
        const { progData, creditCounts } = getStudentData(
          startDate,
          students,
          creditThresholdKeys,
          creditThresholdAmounts,
          bachelorlimits,
          limitKeys,
          'KH'
        )

        progressStats.creditCounts.bachelor[year] = [...progressStats.creditCounts.bachelor[year], ...creditCounts]

        if (!(progId in bachelorProgress)) {
          bachelorProgress[progId] = new Array(reversedYears.length - 1)
        }
        bachelorProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => progData[key])
      } else if (code.includes('MH')) {
        const allMsStudents = studyrights
          .filter(sr => sr.extentcode === 2 && sr.studyrightid.slice(-2) !== '-2')
          .map(sr => sr.studentnumber)
        const allBcMsStudents = studyrights
          .filter(sr => sr.extentcode === 2 && sr.studyrightid.slice(-2) === '-2')
          .map(sr => sr.studentnumber)
        const bcMsStudents = await studytrackStudents(allBcMsStudents)
        const msStudents = await studytrackStudents(allMsStudents)

        // Get credit threshold values both 'combined study programme' and 'only master studyright' are false
        const { creditThresholdKeys: creditThresholdKeysBcMs, creditThresholdAmounts: creditThresholdAmountsBcMs } =
          getCreditThresholds(code, false, false)

        const { progData: bcMsProgdata, creditCounts: creditCountsBcMs } = getStudentData(
          startDate,
          bcMsStudents,
          creditThresholdKeysBcMs,
          creditThresholdAmountsBcMs,
          bcmslimits,
          limitKeys,
          'MH'
        )
        const { progData: msProgdata, creditCounts: creditCountsMaster } = getStudentData(
          startDate,
          msStudents,
          creditThresholdKeys,
          creditThresholdAmounts,
          masterlimits,
          limitKeys,
          'MH'
        )
        if (['MH30_001', 'MH30_003'].includes(code)) {
          progressStats.creditCounts.licentiate[year] = [
            ...progressStats.creditCounts.licentiate[year],
            ...creditCountsMaster,
          ]
          if (!(progId in licentiateProgress)) {
            licentiateProgress[progId] = new Array(reversedYears.length - 1)
          }
          licentiateProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => msProgdata[key])
        } else {
          progressStats.creditCounts.bachelorMaster[year] = [
            ...progressStats.creditCounts.bachelorMaster[year],
            ...creditCountsBcMs,
          ]
          progressStats.creditCounts.master[year] = [...progressStats.creditCounts.master[year], ...creditCountsMaster]
          if (!(progId in masterProgress)) {
            masterProgress[progId] = new Array(reversedYears.length - 1)
            bcmsProgress[progId] = new Array(reversedYears.length - 1)
          }
          masterProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => msProgdata[key])
          bcmsProgress[progId][indexOf(reversedYears, year)] = limitKeys.map(key => bcMsProgdata[key])
        }
      } else {
        const all = studyrights.filter(sr => sr.extentcode === 4 || sr.extentcode === 3).map(sr => sr.studentnumber)
        const doctoralStudents = await studytrackStudents(all)

        const { data, creditCounts } = getStudentData(
          startDate,
          doctoralStudents,
          creditThresholdKeys,
          creditThresholdAmounts,
          undefined,
          undefined,
          'T'
        )

        progressStats.creditCounts.doctor[year] = [...progressStats.creditCounts.doctor[year], ...creditCounts]

        if (!(progId in doctoralProgress)) {
          doctoralProgress[progId] = new Array(reversedYears.length - 1)
        }
        doctoralProgress[progId][indexOf(reversedYears, year)] = creditThresholdKeys.map(key => data[key])
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
  progressStats.licentiateProgStats = Object.keys(licentiateProgress)
    .filter(prog => !licentiateProgress[prog].every(year => year.every(value => value === 0)))
    .reduce((result, prog) => ({ ...result, [prog]: licentiateProgress[prog] }), {})
  progressStats.doctoralProgStats = Object.keys(doctoralProgress)
    .filter(prog => !doctoralProgress[prog].every(year => year.every(value => value === 0)))
    .reduce((result, prog) => ({ ...result, [prog]: doctoralProgress[prog] }), {})
  return progressStats
}
module.exports = { combineFacultyStudentProgress }
