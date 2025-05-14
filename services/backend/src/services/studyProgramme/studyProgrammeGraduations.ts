import { indexOf, orderBy } from 'lodash'

import {
  GraduationStatistics,
  Name,
  SemesterEnrollment,
  StudyTrack,
  DegreeProgrammeType,
  ExtentCode,
  Phase,
} from '@oodikone/shared/types'
import { mapToProviders } from '@oodikone/shared/util'
import { getDegreeProgrammeType, getMinimumCreditsOfProgramme, sortByProgrammeCode } from '../../util'
import { countTimeCategories } from '../graduationHelpers'
import { getSemestersAndYears } from '../semesters'
import { getStudyRightThesisCredits, getOrganizationThesisCredits } from './creditGetters'
import { getGraduatedStats } from './studyProgrammeBasics'
import {
  defineYear,
  getGoal,
  getId,
  getMedian,
  getStartDate,
  getStatsBasis,
  getThesisType,
  getYearsArray,
  getYearsObject,
  getStudyRightElementsWithPhase,
  hasTransferredFromOrToProgramme,
} from './studyProgrammeHelpers'
import { getStudyRightsInProgramme } from './studyRightFinders'

/**
 * For bachelor + master study right combo. This rules out master's programmes that don't
 * follow the two-phase degree structure (e.g. degree programmes in medicine and dentistry)
 */
export const shouldIncludeComboStats = async (studyProgramme: string) => {
  const degreeProgrammeType = await getDegreeProgrammeType(studyProgramme)
  if (degreeProgrammeType !== DegreeProgrammeType.MASTER) {
    return false
  }
  const minimumCredits = await getMinimumCreditsOfProgramme(studyProgramme)
  return minimumCredits !== null && minimumCredits <= 180
}

const calculateAbsenceInMonths = (
  absence: Awaited<ReturnType<typeof getSemestersAndYears>>['semesters'][string],
  startDate: Date,
  endDate: Date
) => {
  const { startdate: absenceStart, enddate: absenceEnd } = absence

  if (endDate < absenceStart || absenceEnd < startDate) {
    return 0
  }

  const years = absenceEnd.getFullYear() - absenceStart.getFullYear()
  const months = absenceEnd.getMonth() - absenceStart.getMonth()
  const days = absenceEnd.getDay() - absenceStart.getDay()

  const total = years * 12 + months + days / 30

  return Math.round(total)
}

export const calculateDurationOfStudies = (
  startDate: Date,
  graduationDate: Date,
  semesterEnrollments: SemesterEnrollment[],
  semesters: Awaited<ReturnType<typeof getSemestersAndYears>>['semesters']
) => {
  const semestersWithStatutoryAbsence = semesterEnrollments
    .filter(enrollment => enrollment.statutoryAbsence)
    .map(enrollment => enrollment.semester)
  const monthsToSubtract = semestersWithStatutoryAbsence.reduce(
    (acc, semester) => acc + calculateAbsenceInMonths(semesters[semester], startDate, graduationDate),
    0
  )

  const graduationDateAdjusted = graduationDate
  graduationDateAdjusted.setMonth(graduationDateAdjusted.getMonth() - monthsToSubtract)

  const years = graduationDateAdjusted.getFullYear() - startDate.getFullYear()
  const months = graduationDateAdjusted.getMonth() - startDate.getMonth()
  const days = graduationDateAdjusted.getDay() - startDate.getDay()

  const total = years * 12 + months + days / 30

  return Math.round(total)
}

export type GraduationTimes = {
  medians: Array<{
    y: number
    amount: number
    name: string | number
    statistics: GraduationStatistics
    times: number[]
  }>
  goal: number
}

const getGraduationTimeAndThesisWriterStats = async ({
  studyProgramme,
  years,
  isAcademicYear,
  includeAllSpecials,
}: {
  studyProgramme?: string
  years: Array<string | number>
  isAcademicYear: boolean
  includeAllSpecials: boolean
}) => {
  const { graphStats, tableStats } = getStatsBasis(years)
  if (!studyProgramme) {
    return {
      times: { medians: [], goal: 0 },
      doCombo: false,
      comboTimes: { medians: [], goal: 0 },
      thesisGraphStats: graphStats,
      thesisTableStats: tableStats,
    }
  }

  const doCombo = await shouldIncludeComboStats(studyProgramme)
  const graduationTimes: Record<string, number[]> = getYearsObject({ years, emptyArrays: true })
  const graduationTimesCombo: Record<string, number[]> = getYearsObject({ years, emptyArrays: true })
  const { semesters } = await getSemestersAndYears()

  const thesisType = await getThesisType(studyProgramme)
  const studyRights = await getStudyRightsInProgramme(studyProgramme, false)
  const studyRightIds = studyRights.map(studyRight => studyRight.id)
  const studentNumbers = studyRights.map(studyRight => studyRight.studentNumber)

  const studyRightThesisCredits = await getStudyRightThesisCredits(thesisType, studyRightIds)

  const studyRightThesisStudentNumbers = studyRightThesisCredits.map(item => item.student_studentnumber)
  const organizationStudentNumbers = studentNumbers.filter(student => !studyRightThesisStudentNumbers.includes(student))

  const organizationThesisCredits = await getOrganizationThesisCredits(
    mapToProviders([studyProgramme])[0],
    thesisType,
    organizationStudentNumbers
  )

  const thesisWriterMap = [...studyRightThesisCredits, ...organizationThesisCredits].reduce<Record<string, Date>>(
    (acc, credit) => {
      acc[credit.student_studentnumber] = credit.attainment_date
      return acc
    },
    {}
  )

  for (const studyRight of studyRights) {
    const correctStudyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!correctStudyRightElement) continue
    const countAsBachelorMaster = doCombo && studyRight.extentCode === ExtentCode.BACHELOR_AND_MASTER
    const [firstStudyRightElementWithSamePhase] = getStudyRightElementsWithPhase(
      studyRight,
      correctStudyRightElement.phase
    )
    const hasTransferred = hasTransferredFromOrToProgramme(studyRight, correctStudyRightElement)

    if (!includeAllSpecials && hasTransferred.some(fromOrTo => fromOrTo === true)) {
      continue
    }

    if (studyRight.studentNumber in thesisWriterMap) {
      const thesisDate = thesisWriterMap[studyRight.studentNumber]
      const thesisYear = defineYear(thesisDate, isAcademicYear)
      graphStats[indexOf(years, thesisYear)] += 1
      tableStats[thesisYear] += 1
    }

    if (!correctStudyRightElement.graduated || !studyRight.semesterEnrollments) {
      continue
    }

    const startDate = countAsBachelorMaster
      ? getStudyRightElementsWithPhase(studyRight, 1)[0]?.startDate
      : firstStudyRightElementWithSamePhase.startDate
    if (!startDate) {
      continue
    }

    const graduationDate = correctStudyRightElement.endDate

    const duration = calculateDurationOfStudies(startDate, graduationDate, studyRight.semesterEnrollments, semesters)
    const graduationYear = defineYear(graduationDate, isAcademicYear)

    if (!graduationTimes[graduationYear] || !graduationTimesCombo[graduationYear]) {
      continue
    }

    if (countAsBachelorMaster) {
      graduationTimesCombo[graduationYear].push(duration)
    } else {
      graduationTimes[graduationYear].push(duration)
    }
  }

  const goal = await getGoal(studyProgramme)
  const times: GraduationTimes = { medians: [], goal }
  const comboTimes: GraduationTimes = { medians: [], goal: goal + 36 }

  for (const year of years.toReversed()) {
    const median = getMedian(graduationTimes[year])
    const statistics = countTimeCategories(graduationTimes[year], goal)
    times.medians.push({
      y: median,
      amount: graduationTimes[year].length,
      name: year,
      statistics,
      times: [...graduationTimes[year]],
    })

    if (doCombo) {
      const median = getMedian(graduationTimesCombo[year])
      const statistics = countTimeCategories(graduationTimesCombo[year], goal + 36)
      comboTimes.medians.push({
        y: median,
        amount: graduationTimesCombo[year].length,
        name: year,
        statistics,
        times: [...graduationTimesCombo[year]],
      })
    }
  }
  return { times, doCombo, comboTimes, thesisGraphStats: graphStats, thesisTableStats: tableStats }
}

const formatStats = (stats: Record<string, ProgrammeWithYears>, years: Array<string | number>) => {
  const tableStats = Object.values(stats)
    .filter(p => years.map(year => p[year]).find(started => started !== 0)) // Filter out programmes with no-one started between the selected years
    .map(p => [p.code, getId(p.code), p.name, ...years.map(year => p[year])])
    .sort((a, b) => sortByProgrammeCode(a[0] as string, b[0] as string))

  const graphStats = Object.values(stats)
    .filter(p => years.map(year => p[year]).find(started => started !== 0)) // Filter out programmes with no-one started between the selected years
    .map(p => ({ name: p.name, code: p.code, data: years.map(year => p[year]) }))
    .sort((a, b) => sortByProgrammeCode(a.code, b.code))

  return { tableStats, graphStats }
}

type QueryParameters = {
  studyProgramme: string
  since: Date
  years: Array<string | number>
  isAcademicYear: boolean
  includeAllSpecials: boolean
}

type ProgrammeWithYears = {
  [key: string]: number | string | Name
} & StudyTrack

const getProgrammesBeforeStarting = async ({
  studyProgramme,
  years,
  isAcademicYear,
  includeAllSpecials,
}: QueryParameters) => {
  const studyRights = await getStudyRightsInProgramme(studyProgramme, false)

  const stats = studyRights.reduce<Record<string, ProgrammeWithYears>>((acc, studyRight) => {
    const studyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!studyRightElement) return acc
    // If the extent code is something else, that means the student hasn't continued from a bachelor's programme
    if (studyRight.extentCode !== ExtentCode.BACHELOR_AND_MASTER) return acc
    const phase1Programmes = studyRight.studyRightElements.filter(elem => elem.phase === Phase.ANY)
    const [latestPhase1Programme] = orderBy(phase1Programmes, ['endDate'], ['desc'])
    if (!acc[latestPhase1Programme.code]) {
      const programmeWithYears: ProgrammeWithYears = {
        code: latestPhase1Programme.code,
        name: latestPhase1Programme.name,
        ...getYearsObject({ years }),
      }
      acc[latestPhase1Programme.code] = programmeWithYears
    }
    const phase2Programmes = studyRight.studyRightElements.filter(elem => elem.phase === Phase.MASTER)

    const hasTransferred = hasTransferredFromOrToProgramme(studyRight, studyRightElement)

    if (!includeAllSpecials && hasTransferred.some(fromOrTo => fromOrTo === true)) return acc

    const startDateInProgramme = phase2Programmes.find(elem => elem.code === studyProgramme)?.startDate
    if (!startDateInProgramme) return acc
    ;(acc[latestPhase1Programme.code][defineYear(startDateInProgramme, isAcademicYear)] as number) += 1
    return acc
  }, {})

  const graphAndTableStats = formatStats(stats, years)
  return graphAndTableStats
}

const getProgrammesAfterGraduation = async ({
  studyProgramme,
  years,
  isAcademicYear,
  includeAllSpecials,
}: QueryParameters) => {
  const studyRights = await getStudyRightsInProgramme(studyProgramme, true)

  const stats = studyRights.reduce<Record<string, ProgrammeWithYears>>((acc, studyRight) => {
    const studyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!studyRightElement) return acc
    const hasTransferred = hasTransferredFromOrToProgramme(studyRight, studyRightElement)

    if (!includeAllSpecials && hasTransferred.some(fromOrTo => fromOrTo === true)) return acc

    const phase2Programmes = studyRight.studyRightElements.filter(elem => elem.phase === Phase.MASTER)
    const [firstPhase2Programme] = orderBy(phase2Programmes, ['startDate'], ['asc'])
    if (!firstPhase2Programme) return acc

    if (!acc[firstPhase2Programme.code]) {
      const programmeWithYears: ProgrammeWithYears = {
        code: firstPhase2Programme.code,
        name: firstPhase2Programme.name,
        ...getYearsObject({ years }),
      }
      acc[firstPhase2Programme.code] = programmeWithYears
    }

    ;(acc[firstPhase2Programme.code][defineYear(firstPhase2Programme.startDate, isAcademicYear)] as number) += 1
    return acc
  }, {})

  const graphAndTableStats = formatStats(stats, years)
  return graphAndTableStats
}

const getProgrammesBeforeOrAfter = async (studyprogramme: string, queryParameters: QueryParameters) => {
  const degreeProgrammeType = await getDegreeProgrammeType(studyprogramme)
  if (degreeProgrammeType === DegreeProgrammeType.BACHELOR) {
    return await getProgrammesAfterGraduation(queryParameters)
  }
  if (degreeProgrammeType === DegreeProgrammeType.MASTER) {
    return await getProgrammesBeforeStarting(queryParameters)
  }
  return null
}

export const getGraduationStatsForStudyTrack = async ({
  studyProgramme,
  combinedProgramme,
  settings,
}: {
  studyProgramme: string
  combinedProgramme?: string
  settings: { isAcademicYear: boolean; includeAllSpecials: boolean }
}) => {
  const { isAcademicYear, includeAllSpecials } = settings
  const since = getStartDate(isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear) as number[]
  const queryParameters = { studyProgramme, since, years, isAcademicYear, includeAllSpecials }
  const combinedQueryParameters = {
    studyProgramme: combinedProgramme ?? '',
    since,
    years,
    isAcademicYear,
    includeAllSpecials,
  }

  const graduated = await getGraduatedStats(queryParameters)
  const graduatedSecondProgramme = await getGraduatedStats(combinedQueryParameters)

  const graduationTimeStats = await getGraduationTimeAndThesisWriterStats(queryParameters)
  const graduationTimeStatsSecondProg = await getGraduationTimeAndThesisWriterStats(combinedQueryParameters)

  const programmesBeforeOrAfter = await getProgrammesBeforeOrAfter(studyProgramme, queryParameters)

  const reversedYears = getYearsArray(since.getFullYear(), isAcademicYear).reverse()

  const titles =
    studyProgramme.includes('LIS') || studyProgramme.includes('T')
      ? ['', 'Graduated']
      : ['', 'Graduated', 'Wrote thesis']
  const combinedTitles = [
    '',
    'Graduated bachelor',
    'Wrote thesis bachelor',
    'Graduated licentiate',
    'Wrote thesis licentiate',
  ]
  const programmesBeforeOrAfterTitles = ['Code', 'Id', 'Programme', ...years]
  const tableStatsDefault = combinedProgramme
    ? reversedYears.map(year => [
        year,
        graduated.tableStats[year],
        graduationTimeStats.thesisTableStats[year],
        graduatedSecondProgramme.tableStats[year],
        graduationTimeStatsSecondProg.thesisTableStats[year],
      ])
    : reversedYears.map(year => [year, graduated.tableStats[year], graduationTimeStats.thesisTableStats[year]])

  const tableStats =
    studyProgramme.includes('LIS') || studyProgramme.includes('T')
      ? reversedYears.map(year => [year, graduated.tableStats[year]])
      : tableStatsDefault

  const graphStats = combinedProgramme
    ? [
        { name: 'Graduated bachelor', data: graduated.graphStats },
        { name: 'Wrote thesis bachelor', data: graduationTimeStats.thesisGraphStats },
        { name: 'Graduated licentiate', data: graduatedSecondProgramme.graphStats },
        { name: 'Wrote thesis licentiate', data: graduationTimeStatsSecondProg.thesisGraphStats },
      ]
    : [
        { name: 'Graduated students', data: graduated.graphStats },
        { name: 'Wrote thesis', data: graduationTimeStats.thesisGraphStats },
      ]

  return {
    id: combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme,
    years,
    tableStats,
    titles: combinedProgramme ? combinedTitles : titles,
    graphStats:
      studyProgramme.includes('LIS') || studyProgramme.includes('T')
        ? [{ name: 'Graduated students', data: graduated.graphStats }]
        : graphStats,
    graduationTimes: graduationTimeStats.times,
    doCombo: graduationTimeStats.doCombo,
    comboTimes: graduationTimeStats.comboTimes,
    graduationTimesSecondProgramme: graduationTimeStatsSecondProg.comboTimes,
    programmesBeforeOrAfterTableStats: programmesBeforeOrAfter?.tableStats,
    programmesBeforeOrAfterGraphStats: programmesBeforeOrAfter?.graphStats,
    programmesBeforeOrAfterTitles,
  }
}
