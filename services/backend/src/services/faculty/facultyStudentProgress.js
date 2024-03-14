const { indexOf, inRange } = require('lodash')
const moment = require('moment')
const { getAcademicYearDates } = require('../../util/semester')
const { getCreditThresholds, getYearsArray } = require('../studyprogramme/studyprogrammeHelpers')
const { studytrackStudents } = require('../studyprogramme/studentGetters')
const { getStudyRightsByExtent, getStudyRightsByBachelorStart, getTransfersIn, getTransfersOut } = require('./faculty')
const { checkTransfers } = require('./facultyHelpers')

const getStudentData = (
  startDate,
  students,
  prog,
  limits = [],
  limitKeys = [],
  thresholdKeys = [],
  thresholdAmounts = []
) => {
  const data = {}
  const programmeData = {}
  const creditCounts = students.map(({ credits }) =>
    credits
      .filter(credit => moment(credit.attainment_date).isSameOrAfter(startDate))
      .reduce((total, credit) => total + credit.credits, 0)
  )
  thresholdKeys.forEach(t => {
    data[t] = 0
  })
  limitKeys.forEach(t => {
    programmeData[t] = 0
  })

  // Data is only used for doctoral programmes, otherwise only programmeData is needed
  if (prog === 'T') {
    creditCounts.forEach(creditCount => {
      thresholdKeys.some((thresholdKey, index) => {
        if (
          (index === 0 && creditCount < thresholdAmounts[0]) ||
          (index === thresholdKeys.length - 1 && creditCount >= thresholdAmounts[index - 1]) ||
          (index > 0 && inRange(creditCount, thresholdAmounts[index - 1], thresholdAmounts[index]))
        ) {
          data[thresholdKey] += 1
          return true
        }
        return false
      })
    })
  } else {
    creditCounts.forEach(creditCount => {
      programmeData[limitKeys[0]] += creditCount <= limits[5][0] ? 1 : 0
      programmeData[limitKeys[1]] += inRange(creditCount, limits[4][0], limits[4][1]) ? 1 : 0
      programmeData[limitKeys[2]] += inRange(creditCount, limits[3][0], limits[3][1]) ? 1 : 0
      programmeData[limitKeys[3]] += inRange(creditCount, limits[2][0], limits[2][1]) ? 1 : 0
      programmeData[limitKeys[4]] += inRange(creditCount, limits[1][0], limits[1][1]) ? 1 : 0
      programmeData[limitKeys[5]] += creditCount >= limits[0][0] ? 1 : 0
    })
  }

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
    const months = Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(startDate))).asMonths())
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

      if (!(progId in progressStats.programmeNames)) {
        progressStats.programmeNames[progId] = { code, ...name }
      }
      if (!includeAllSpecials) {
        studyrights = await filterOutTransfers(studyrights, code, startDate, endDate)
      }
      if (code.includes('KH')) {
        const allBachelors = studyrights.filter(sr => sr.extentcode === 1).map(sr => sr.studentnumber)
        const students = await studytrackStudents(allBachelors)
        const { progData, creditCounts } = getStudentData(startDate, students, 'KH', bachelorlimits, limitKeys)

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

        const { progData: bcMsProgdata, creditCounts: creditCountsBcMs } = getStudentData(
          startDate,
          bcMsStudents,
          'MH',
          bcmslimits,
          limitKeys
        )
        const { progData: msProgdata, creditCounts: creditCountsMaster } = getStudentData(
          startDate,
          msStudents,
          'MH',
          masterlimits,
          limitKeys
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
        const { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds(code)

        const { data, creditCounts } = getStudentData(
          startDate,
          doctoralStudents,
          'T',
          [],
          [],
          creditThresholdKeys,
          creditThresholdAmounts
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
