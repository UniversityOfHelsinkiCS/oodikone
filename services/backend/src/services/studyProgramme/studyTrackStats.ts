import moment from 'moment'

import { Credit, SISStudyRight, SISStudyRightElement } from '@oodikone/shared/models'
import {
  GraduationTimes,
  MedianEntry,
  ProgrammeOrStudyTrackGraduationStats,
  StudyTrackStats,
  GenderCode,
  EnrollmentType,
  ExtentCode,
  SemesterEnrollment,
} from '@oodikone/shared/types'
import { createLocaleComparator, keysOf } from '../../util'
import { countTimeCategories } from '../graduationHelpers'
import { getSemestersAndYears } from '../semesters'
import { getDateOfFirstSemesterPresent } from './studyProgrammeBasics'
import { calculateDurationOfStudies, shouldIncludeComboStats } from './studyProgrammeGraduations'
import {
  defineYear,
  getGoal,
  getMedian,
  getPercentage,
  getStartDate,
  getStudyRightElementsWithPhase,
  getYearsArray,
  getYearsObject,
  hasTransferredFromOrToProgramme,
  tableTitles,
} from './studyProgrammeHelpers'
import { getStudyTracksForProgramme } from './studyRightFinders'

const getCreditCount = (credits: Credit[], startDate: Date) =>
  credits
    .filter(credit => moment(credit.attainment_date).isSameOrAfter(startDate))
    .reduce((prev, curr) => prev + curr.credits, 0)

const getGraduationTimeStats = async (
  studyProgramme: string,
  graduationTimes: Record<string, Record<string, number[]>>,
  graduationTimesCombo: Record<string, Record<string, number[]>>,
  mainStatsByTrack: ReturnType<typeof combineStats>['mainStatsByTrack'],
  combinedProgramme?: string
) => {
  const goal = await getGoal(combinedProgramme ?? studyProgramme)
  const finalGraduationTimes = { goals: { basic: goal, combo: goal + 36 } }

  const calculateGraduationTimes = (
    graduationTimes: Record<string, Record<string, number[]>>,
    type: 'basic' | 'combo'
  ) => {
    for (const programmeOrTrack of Object.keys(graduationTimes)) {
      const stats = graduationTimes[programmeOrTrack]
      finalGraduationTimes[programmeOrTrack] ??= { medians: { basic: [] as MedianEntry[], combo: [] as MedianEntry[] } }
      for (const [year, oneYearStats] of Object.entries(stats)) {
        const classSize = mainStatsByTrack[combinedProgramme ? studyProgramme : programmeOrTrack].find(
          stats => stats[0] === year
        )?.[1]
        if (classSize === 0 || typeof classSize !== 'number') {
          continue
        }
        const final = {
          amount: oneYearStats.length,
          classSize,
          name: year,
          statistics: countTimeCategories(oneYearStats, finalGraduationTimes.goals[type]),
          y: getMedian(oneYearStats),
          times: [...oneYearStats],
        }
        ;(finalGraduationTimes[programmeOrTrack] as ProgrammeOrStudyTrackGraduationStats).medians[type].push(final)
      }
      ;(finalGraduationTimes[programmeOrTrack] as ProgrammeOrStudyTrackGraduationStats).medians[type].sort(
        createLocaleComparator('name', true)
      )
    }
  }

  calculateGraduationTimes(graduationTimes, 'basic')
  calculateGraduationTimes(graduationTimesCombo, 'combo')

  return finalGraduationTimes as GraduationTimes
}

const getEmptyYear = () => ({
  all: 0,
  started: 0,
  present: 0,
  absent: 0,
  inactive: 0,
  graduated: 0,
  graduatedCombinedProgramme: 0,
  male: 0,
  female: 0,
  otherUnknown: 0,
  finnish: 0,
  otherCountries: 0,
  otherCountriesCounts: {} as Record<string, number>,
})

type YearlyData = Record<string, ReturnType<typeof getEmptyYear>>

type StudyRightWithSemesterEnrollments = SISStudyRight & {
  semesterEnrollments: SemesterEnrollment[]
}

const combineStats = (
  years: string[],
  yearlyStats: Record<string, YearlyData>,
  studyProgramme: string,
  combinedProgramme?: string
) => {
  type MainStats = Record<string, Array<Array<string | number>>>

  const mainStatsByYear: MainStats = getYearsObject({ years, emptyArrays: true })

  const mainStatsByTrack: MainStats = {}

  const otherCountriesCount: Record<string, Record<string, Record<string, number>>> = {}

  for (const year of Object.keys(yearlyStats)) {
    for (const programmeOrStudyTrack of Object.keys(yearlyStats[year])) {
      const yearStats = yearlyStats[year][programmeOrStudyTrack]
      if (!mainStatsByYear[year]) {
        mainStatsByYear[year] = []
      }
      if (!mainStatsByTrack[programmeOrStudyTrack]) {
        mainStatsByTrack[programmeOrStudyTrack] = []
      }

      const yearArray = [
        yearStats.all,
        yearStats.started,
        getPercentage(yearStats.started, yearStats.all),
        yearStats.present,
        getPercentage(yearStats.present, yearStats.all),
        yearStats.absent,
        getPercentage(yearStats.absent, yearStats.all),
        yearStats.inactive,
        getPercentage(yearStats.inactive, yearStats.all),
        yearStats.graduated,
        getPercentage(yearStats.graduated, yearStats.all),
        yearStats.male,
        getPercentage(yearStats.male, yearStats.all),
        yearStats.female,
        getPercentage(yearStats.female, yearStats.all),
        yearStats.otherUnknown,
        getPercentage(yearStats.otherUnknown, yearStats.all),
        yearStats.finnish,
        getPercentage(yearStats.finnish, yearStats.all),
        yearStats.otherCountries,
        getPercentage(yearStats.otherCountries, yearStats.all),
      ]
      if (combinedProgramme) {
        yearArray.splice(
          11,
          0,
          yearStats.graduatedCombinedProgramme,
          getPercentage(yearStats.graduatedCombinedProgramme, yearStats.all)
        )
      }
      mainStatsByYear[year].push([
        programmeOrStudyTrack === studyProgramme ? year : programmeOrStudyTrack,
        ...yearArray,
      ])
      mainStatsByTrack[programmeOrStudyTrack].push([year, ...yearArray])
      if (Object.keys(yearStats.otherCountriesCounts).length > 0) {
        if (!otherCountriesCount[programmeOrStudyTrack]) {
          otherCountriesCount[programmeOrStudyTrack] = {}
        }
        otherCountriesCount[programmeOrStudyTrack][year] = yearStats.otherCountriesCounts
      }
    }
  }

  return { mainStatsByYear, mainStatsByTrack, otherCountriesCount }
}

const getMainStatsByTrackAndYear = async (
  years: string[],
  studyProgramme: string,
  includeGraduated: boolean,
  includeAllSpecials: boolean,
  doCombo: boolean,
  studyRightsOfProgramme: Array<SISStudyRight>,
  combinedProgramme?: string
) => {
  const yearlyStats: Record<string, YearlyData> = {}

  const { semesters } = await getSemestersAndYears()
  const { semestercode: currentSemester } = Object.values(semesters).find(semester => semester.enddate >= new Date())!

  const graduationTimes: Record<string, Record<string, number[]>> = {}
  const graduationTimesCombo: Record<string, Record<string, number[]>> = {}
  const graduationTimesCombinedProgrammeCombo: Record<string, Record<string, number[]>> = {}

  const updateCounts = (
    year: string,
    programmeOrStudyTrack: string,
    studyRight: StudyRightWithSemesterEnrollments,
    hasTransferredToProgramme: boolean,
    startedInProgramme: Date,
    studyRightElement: SISStudyRightElement
  ) => {
    if (!yearlyStats[year]) {
      yearlyStats[year] = {}
    }
    if (!yearlyStats[year][programmeOrStudyTrack]) {
      yearlyStats[year][programmeOrStudyTrack] = getEmptyYear()
    }
    yearlyStats[year][programmeOrStudyTrack].all += 1
    if (!hasTransferredToProgramme) {
      const firstPresentAt = getDateOfFirstSemesterPresent(
        studyRight.semesterEnrollments,
        semesters,
        currentSemester,
        startedInProgramme
      )
      if (firstPresentAt) {
        const firstPresentYear = defineYear(firstPresentAt, true)
        if (year === firstPresentYear) {
          yearlyStats[year][programmeOrStudyTrack].started += 1
        }
      }
    }
    if (studyRight.student.gender_code === GenderCode.MALE) {
      yearlyStats[year][programmeOrStudyTrack].male += 1
    } else if (studyRight.student.gender_code === GenderCode.FEMALE) {
      yearlyStats[year][programmeOrStudyTrack].female += 1
    } else {
      yearlyStats[year][programmeOrStudyTrack].otherUnknown += 1
    }

    const hasGraduated = studyRightElement.graduated
    const hasGraduatedFromCombinedProgramme = combinedProgramme
      ? (studyRight.studyRightElements.find(element => element.code === combinedProgramme)?.graduated ?? false)
      : false

    if (hasGraduated) {
      yearlyStats[year][programmeOrStudyTrack].graduated += 1
    }
    if (hasGraduatedFromCombinedProgramme) {
      yearlyStats[year][programmeOrStudyTrack].graduatedCombinedProgramme += 1
    } else if (combinedProgramme || !hasGraduated) {
      const currentSemesterStatus = studyRight.semesterEnrollments?.find(
        enrollment => enrollment.semester === currentSemester
      )?.type
      if (currentSemesterStatus === EnrollmentType.PRESENT) {
        yearlyStats[year][programmeOrStudyTrack].present += 1
      } else if (currentSemesterStatus === EnrollmentType.ABSENT) {
        yearlyStats[year][programmeOrStudyTrack].absent += 1
      } else {
        yearlyStats[year][programmeOrStudyTrack].inactive += 1
      }
    }

    const studentCitizenships = studyRight.student.citizenships

    for (const citizenship of studentCitizenships) {
      const country = citizenship.en
      if (!country) {
        continue
      }
      if (country === 'Finland') {
        yearlyStats[year][programmeOrStudyTrack].finnish += 1
      } else {
        yearlyStats[year][programmeOrStudyTrack].otherCountries += 1
        yearlyStats[year][programmeOrStudyTrack].otherCountriesCounts[country] ??= 0
        yearlyStats[year][programmeOrStudyTrack].otherCountriesCounts[country] += 1
      }
    }

    if (!hasGraduated) return
    const countAsBachelorMaster = doCombo && studyRight.extentCode === ExtentCode.BACHELOR_AND_MASTER
    const [firstStudyRightElementWithSamePhase] = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)

    const startDate = countAsBachelorMaster
      ? getStudyRightElementsWithPhase(studyRight, 1)[0]?.startDate
      : firstStudyRightElementWithSamePhase.startDate
    if (!startDate) return

    const graduationDate = studyRightElement.endDate

    const duration = calculateDurationOfStudies(startDate, graduationDate, studyRight.semesterEnrollments, semesters)

    if (countAsBachelorMaster) {
      if (!graduationTimesCombo[programmeOrStudyTrack]) {
        graduationTimesCombo[programmeOrStudyTrack] = getYearsObject({
          years: years.filter(year => year !== 'Total'),
          emptyArrays: true,
        })
      }
      const startYearInBachelor = defineYear(startDate, true)
      if (graduationTimesCombo[programmeOrStudyTrack][startYearInBachelor]) {
        graduationTimesCombo[programmeOrStudyTrack][startYearInBachelor].push(duration)
      }
    } else {
      if (!graduationTimes[programmeOrStudyTrack]) {
        graduationTimes[programmeOrStudyTrack] = getYearsObject({
          years: years.filter(year => year !== 'Total'),
          emptyArrays: true,
        })
      }
      graduationTimes[programmeOrStudyTrack][year].push(duration)
    }

    if (!hasGraduatedFromCombinedProgramme) return
    const bachelorStartDate = getStudyRightElementsWithPhase(studyRight, 1)[0]?.startDate
    if (!bachelorStartDate) return
    if (!graduationTimesCombinedProgrammeCombo[combinedProgramme!]) {
      graduationTimesCombinedProgrammeCombo[combinedProgramme!] = getYearsObject({
        years: years.filter(year => year !== 'Total'),
        emptyArrays: true,
      })
    }
    const startYearInNewBachelorProgramme = defineYear(studyRightElement.startDate, true)
    const combinedDuration = calculateDurationOfStudies(
      bachelorStartDate,
      studyRight.studyRightElements.find(element => element.code === combinedProgramme)!.endDate,
      studyRight.semesterEnrollments,
      semesters
    )
    if (graduationTimesCombinedProgrammeCombo[combinedProgramme!][startYearInNewBachelorProgramme]) {
      graduationTimesCombinedProgrammeCombo[combinedProgramme!][startYearInNewBachelorProgramme].push(combinedDuration)
    }
  }

  const creditCounts: Record<string, number[]> = getYearsObject({
    years: years.filter(year => year !== 'Total'),
    emptyArrays: true,
  })

  const creditCountsCombo: Record<string, number[]> = doCombo
    ? getYearsObject({ years: years.filter(year => year !== 'Total'), emptyArrays: true })
    : {}

  for (const studyRight of studyRightsOfProgramme) {
    if (!studyRight.semesterEnrollments || !studyRight.student) {
      continue
    }
    const studyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!studyRightElement) {
      continue
    }
    if (!includeGraduated && studyRightElement.graduated) {
      continue
    }

    const [hasTransferredFromProgramme, hasTransferredToProgramme] = hasTransferredFromOrToProgramme(
      studyRight,
      studyRightElement
    )

    if (!includeAllSpecials && (hasTransferredToProgramme || hasTransferredFromProgramme)) {
      continue
    }

    const startedInProgramme = new Date(studyRightElement.startDate)
    const startYear = defineYear(startedInProgramme, true)
    if (!years.includes(startYear)) {
      continue
    }
    updateCounts(
      startYear,
      studyProgramme,
      studyRight as StudyRightWithSemesterEnrollments,
      hasTransferredToProgramme,
      startedInProgramme,
      studyRightElement
    )

    const studyTrack = studyRightElement.studyTrack?.code ?? null
    if (studyTrack) {
      updateCounts(
        startYear,
        studyTrack,
        studyRight as StudyRightWithSemesterEnrollments,
        hasTransferredToProgramme,
        startedInProgramme,
        studyRightElement
      )
    }
    const countAsBachelorMaster = doCombo && studyRight.extentCode === ExtentCode.BACHELOR_AND_MASTER
    if (countAsBachelorMaster) {
      const startedInBachelor = getStudyRightElementsWithPhase(studyRight, 1)[0]?.startDate
      if (startedInBachelor && years.includes(defineYear(startedInBachelor, true))) {
        creditCountsCombo[defineYear(startedInBachelor, true)].push(
          getCreditCount(studyRight.student.credits, startedInBachelor)
        )
      }
    } else {
      creditCounts[startYear].push(getCreditCount(studyRight.student.credits, startedInProgramme))
    }
  }

  for (const year of Object.keys(yearlyStats)) {
    if (year === 'Total') continue
    for (const track of Object.keys(yearlyStats[year])) {
      if (!yearlyStats.Total) {
        yearlyStats.Total = {}
      }
      if (!yearlyStats.Total[track]) {
        yearlyStats.Total[track] = getEmptyYear()
      }

      for (const field of keysOf(yearlyStats[year][track])) {
        if (field !== 'otherCountriesCounts') {
          yearlyStats.Total[track][field] += yearlyStats[year][track][field]
          continue
        }
        for (const country of Object.keys(yearlyStats[year][track].otherCountriesCounts)) {
          if (!yearlyStats.Total[track].otherCountriesCounts[country]) {
            yearlyStats.Total[track].otherCountriesCounts[country] = 0
          }
          yearlyStats.Total[track].otherCountriesCounts[country] +=
            yearlyStats[year][track].otherCountriesCounts[country]
        }
      }
    }
  }

  const { mainStatsByYear, mainStatsByTrack, otherCountriesCount } = combineStats(
    years,
    yearlyStats,
    studyProgramme,
    combinedProgramme
  )

  const finalGraduationTimes = await getGraduationTimeStats(
    studyProgramme,
    graduationTimes,
    graduationTimesCombo,
    mainStatsByTrack
  )

  const finalCombinedGraduationTimes = await getGraduationTimeStats(
    studyProgramme,
    {},
    graduationTimesCombinedProgrammeCombo,
    mainStatsByTrack,
    combinedProgramme
  )

  return {
    mainStatsByYear,
    mainStatsByTrack,
    otherCountriesCount,
    creditCounts,
    creditCountsCombo,
    graduationTimes: finalGraduationTimes,
    graduationTimesSecondProg: finalCombinedGraduationTimes,
  }
}

// Combines all the data for the Study tracks and class statistics page in study programme overview
// At the moment combined programme is thought to have only one track, the programme itself
export const getStudyTrackStatsForStudyProgramme = async ({
  studyProgramme,
  combinedProgramme,
  settings,
  studyRightsOfProgramme,
}: {
  studyProgramme: string
  combinedProgramme?: string
  settings: { graduated: boolean; specialGroups: boolean }
  studyRightsOfProgramme: Array<SISStudyRight>
}) => {
  const isAcademicYear = true
  const includeYearsCombined = true
  const since = getStartDate(isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)

  const studyTracks = await getStudyTracksForProgramme(studyProgramme)

  const doCombo = await shouldIncludeComboStats(studyProgramme)
  const stats = await getMainStatsByTrackAndYear(
    years,
    studyProgramme,
    settings.graduated,
    settings.specialGroups,
    doCombo,
    studyRightsOfProgramme,
    combinedProgramme
  )

  const getCorrectCombinedTitles = () => {
    if (combinedProgramme === 'MH90_001') return tableTitles.studytracksCombined.licentiate
    return tableTitles.studytracksCombined.master
  }
  const graduatedTitles = combinedProgramme ? getCorrectCombinedTitles() : tableTitles.studytracksBasic

  const studyTrackStats: StudyTrackStats = {
    creditCounts: stats.creditCounts,
    creditCountsCombo: stats.creditCountsCombo,
    doCombo,
    graduationTimes: stats.graduationTimes,
    graduationTimesSecondProg: stats.graduationTimesSecondProg,
    id: combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme,
    includeGraduated: settings.graduated,
    mainStatsByTrack: stats.mainStatsByTrack,
    mainStatsByYear: stats.mainStatsByYear,
    otherCountriesCount: stats.otherCountriesCount,
    populationTitles: [...tableTitles.studytracksStart, ...graduatedTitles, ...tableTitles.studytracksEnd],
    studyTracks,
    years,
  }
  return studyTrackStats
}
