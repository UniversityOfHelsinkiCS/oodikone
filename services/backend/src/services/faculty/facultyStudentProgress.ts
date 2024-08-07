import { indexOf, inRange } from 'lodash'
import moment from 'moment'

import { ExtentCode } from '../../types'
import { getAcademicYearDates } from '../../util/semester'
import { studytrackStudents } from '../studyProgramme/studentGetters'
import { getCreditThresholds, getYearsArray } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsByExtent, getStudyRightsByBachelorStart } from './faculty'
import { checkTransfers } from './facultyHelpers'
import { getTransfersIn, getTransfersOut } from './facultyTransfers'

type Limits = ReturnType<typeof createLimits>

const LIMIT_KEYS = ['zero', 't5', 't4', 't3', 't2', 't1'] as const

const getStudentData = (
  startDate,
  students,
  limits: Limits = [],
  limitKeys: typeof LIMIT_KEYS | [] = [],
  thresholdKeys: string[] = [],
  thresholdAmounts: number[] = []
) => {
  const data = {}
  const programmeData = {}
  const creditCounts = students.map(({ credits }) =>
    credits
      .filter(credit => moment(credit.attainment_date).isSameOrAfter(startDate))
      .reduce((total, credit) => total + credit.credits, 0)
  )
  thresholdKeys.forEach(threshold => {
    data[threshold] = 0
  })
  limitKeys.forEach(limit => {
    programmeData[limit] = 0
  })

  // Data is only used for doctoral programmes, otherwise only programmeData is needed
  if (limitKeys.length === 0) {
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
  const filteredStudyrights = studyrights.filter(
    studyright => !checkTransfers(studyright, transferredIn, transferredOut)
  )
  return filteredStudyrights
}

export const combineFacultyStudentProgress = async (faculty, programmes, specialGroups, graduated) => {
  const since = new Date('2017-08-01')
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'
  const includeGraduated = graduated === 'GRADUATED_INCLUDED'
  const graduationStatus = [0]
  if (includeGraduated) {
    graduationStatus.push(1)
  }
  const yearsArray = getYearsArray(since.getFullYear(), true, true)
  const progressStats = {
    id: faculty,
    years: yearsArray,
    yearlyBachelorTitles: [] as Array<ReturnType<typeof createYearlyTitles>>,
    yearlyBcMsTitles: [] as Array<ReturnType<typeof createYearlyTitles>>,
    yearlyMasterTitles: [] as Array<ReturnType<typeof createYearlyTitles>>,
    yearlyLicentiateTitles: [] as Array<ReturnType<typeof createYearlyTitles>>,
    programmeNames: {},
    bachelorsProgStats: {},
    bcMsProgStats: {},
    licentiateProgStats: {},
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

  type Limits = ReturnType<typeof createLimits>

  let bachelorlimits: Limits = []
  let masterlimits: Limits = []
  let bcmslimits: Limits = []
  let licentiatelimits: Limits = []
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
    progressStats.yearlyBachelorTitles.push(createYearlyTitles(0, bachelorlimits))
    progressStats.yearlyMasterTitles.push(createYearlyTitles(0, masterlimits))
    progressStats.yearlyLicentiateTitles.push(createYearlyTitles(0, licentiatelimits))
    progressStats.yearlyBcMsTitles.push(createYearlyTitles(0, bcmslimits))

    progressStats.creditCounts.bachelor[year] = []
    progressStats.creditCounts.bachelorMaster[year] = []
    progressStats.creditCounts.master[year] = []
    progressStats.creditCounts.licentiate[year] = []
    progressStats.creditCounts.doctor[year] = []

    for (const { progId, code, name } of programmes) {
      const extentCodes = [ExtentCode.BACHELOR, ExtentCode.MASTER, ExtentCode.LICENTIATE, ExtentCode.DOCTOR]
      if (includeAllSpecials) {
        extentCodes.push(
          ExtentCode.CONTINUING_EDUCATION,
          ExtentCode.EXCHANGE_STUDIES,
          ExtentCode.OPEN_UNIVERSITY_STUDIES,
          ExtentCode.NON_DEGREE_PEGAGOGICAL_STUDIES_FOR_TEACHERS,
          ExtentCode.CONTRACT_TRAINING,
          ExtentCode.NON_DEGREE_PROGRAMME_FOR_SPECIAL_EDUCATION_TEACHERS,
          ExtentCode.SPECIALIST_TRAINING_IN_MEDICINE_AND_DENTISTRY,
          ExtentCode.EXCHANGE_STUDIES_POSTGRADUATE,
          ExtentCode.NON_DEGREE_STUDIES
        )
      }

      // For bachelor-master we want to have the start of the bachelor programme of the student.
      let studyrights = code.includes('MH')
        ? await getStudyRightsByBachelorStart(faculty, startDate, endDate, code, extentCodes, graduationStatus)
        : await getStudyRightsByExtent(faculty, startDate, endDate, code, extentCodes, graduationStatus)

      // Get credit threshold values: 'combined study programme' is false and 'only master studyright' is true

      if (!(progId in progressStats.programmeNames)) {
        progressStats.programmeNames[progId] = { code, ...name }
      }
      if (!includeAllSpecials) {
        studyrights = await filterOutTransfers(studyrights, code, startDate, endDate)
      }
      if (code.includes('KH')) {
        const allBachelors = studyrights
          .filter(studyright => studyright.extentcode === ExtentCode.BACHELOR)
          .map(studyright => studyright.studentnumber)
        const students = await studytrackStudents(allBachelors)
        const { progData, creditCounts } = getStudentData(startDate, students, bachelorlimits, LIMIT_KEYS)

        progressStats.creditCounts.bachelor[year] = [...progressStats.creditCounts.bachelor[year], ...creditCounts]

        if (!(progId in bachelorProgress)) {
          bachelorProgress[progId] = new Array(reversedYears.length - 1)
        }
        bachelorProgress[progId][indexOf(reversedYears, year)] = LIMIT_KEYS.map(key => progData[key])
      } else if (code.includes('MH')) {
        const allMsStudents = studyrights
          .filter(
            studyright => studyright.extentcode === ExtentCode.MASTER && studyright.studyrightid.slice(-2) !== '-2'
          )
          .map(studyright => studyright.studentnumber)
        const allBcMsStudents = studyrights
          .filter(
            studyright => studyright.extentcode === ExtentCode.MASTER && studyright.studyrightid.slice(-2) === '-2'
          )
          .map(studyright => studyright.studentnumber)
        const bcMsStudents = await studytrackStudents(allBcMsStudents)
        const msStudents = await studytrackStudents(allMsStudents)

        const { progData: bcMsProgdata, creditCounts: creditCountsBcMs } = getStudentData(
          startDate,
          bcMsStudents,
          bcmslimits,
          LIMIT_KEYS
        )
        const { progData: msProgdata, creditCounts: creditCountsMaster } = getStudentData(
          startDate,
          msStudents,
          masterlimits,
          LIMIT_KEYS
        )
        if (['MH30_001', 'MH30_003'].includes(code)) {
          progressStats.creditCounts.licentiate[year] = [
            ...progressStats.creditCounts.licentiate[year],
            ...creditCountsMaster,
          ]
          if (!(progId in licentiateProgress)) {
            licentiateProgress[progId] = new Array(reversedYears.length - 1)
          }
          licentiateProgress[progId][indexOf(reversedYears, year)] = LIMIT_KEYS.map(key => msProgdata[key])
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
          masterProgress[progId][indexOf(reversedYears, year)] = LIMIT_KEYS.map(key => msProgdata[key])
          bcmsProgress[progId][indexOf(reversedYears, year)] = LIMIT_KEYS.map(key => bcMsProgdata[key])
        }
      } else {
        const all = studyrights
          .filter(studyright => [ExtentCode.LICENTIATE, ExtentCode.DOCTOR].includes(studyright.extentcode))
          .map(studyright => studyright.studentnumber)
        const doctoralStudents = await studytrackStudents(all)
        const { creditThresholdKeys, creditThresholdAmounts } = getCreditThresholds()

        const { data, creditCounts } = getStudentData(
          startDate,
          doctoralStudents,
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
