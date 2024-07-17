import moment from 'moment'
import { Op, fn, col } from 'sequelize'

import { Credit, SISStudyRight, SISStudyRightElement } from '../../models'
import { GenderCode, EnrollmentType, Name, StudyTrack } from '../../types'
import { getAcademicYearDates } from '../../util/semester'
import { countTimeCategories, getStatutoryAbsences } from '../graduationHelpers'
import { getSemestersAndYears } from '../semesters'
import { getDateOfFirstSemesterPresent } from './studyProgrammeBasics'
import {
  getCorrectStudentnumbers,
  getGoal,
  getMedian,
  getPercentage,
  getStartDate,
  getYearsArray,
  getYearsObject,
  tableTitles,
  defineYear,
  getStudyRightElementsWithPhase,
} from './studyProgrammeHelpers'
import { graduatedStudyRightsByStartDate, getStudyRightsInProgramme } from './studyRightFinders'

const getCreditCount = (credits: Credit[], startDate: Date) =>
  credits
    .filter(credit => moment(credit.attainment_date).isSameOrAfter(startDate))
    .reduce((prev, curr) => prev + curr.credits, 0)

// type: either Bc + Ms combo or Bc/Ms/T/anything else
const addGraduation = async ({ studentNumber, startdate, enddate, times, type }) => {
  const totalTimeToGraduation = moment(enddate).diff(moment(startdate), 'months')
  const statutoryAbsences = await getStatutoryAbsences(studentNumber, startdate, enddate)
  const timeToGraduation = totalTimeToGraduation - statutoryAbsences
  times[type].push(timeToGraduation)
}

const getGraduationTimeStats = async ({ year, graduated, track, graduationTimes, classSize, doCombo }) => {
  if (year === 'Total') {
    return
  }
  // Count how long each student took to graduate
  // Separate Bc + Ms and other
  const times = { combo: [], basic: [] }
  for (const { enddate, startdate, studyrightid, studentNumber } of graduated) {
    if (doCombo && studyrightid.slice(-2) === '-2') {
      await addGraduation({ studentNumber, startdate, enddate, times, type: 'combo' })
    } else {
      await addGraduation({ studentNumber, startdate, enddate, times, type: 'basic' })
    }
  }

  const median = getMedian(times.basic)
  const medianCombo = getMedian(times.combo)
  const statistics = countTimeCategories(times.basic, graduationTimes.goals.basic)
  const statisticsCombo = countTimeCategories(times.combo, graduationTimes.goals.combo)

  graduationTimes[track].medians.combo.push({
    y: medianCombo,
    amount: times.combo.length,
    name: year,
    statistics: statisticsCombo,
    classSize,
  })

  graduationTimes[track].medians.basic.push({
    y: median,
    amount: times.basic.length,
    name: year,
    statistics,
    classSize,
  })
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
  combinedProgramme?: string
) => {
  const studyRightsOfProgramme = await getStudyRightsInProgramme(studyProgramme, false, true)

  const yearlyStats: Record<string, YearlyData> = {}

  const { semesters } = await getSemestersAndYears()
  const { semestercode: currentSemester } = Object.values(semesters).find(semester => semester.enddate >= new Date())!

  const updateCounts = (
    year: string,
    programmeOrStudyTrack: string,
    studyRight: SISStudyRight,
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
      ? studyRight.studyRightElements.find(element => element.code === combinedProgramme)?.graduated ?? false
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

    const studentHomeCountry = studyRight.student.home_country_en

    if (studentHomeCountry === 'Finland') {
      yearlyStats[year][programmeOrStudyTrack].finnish += 1
    } else {
      yearlyStats[year][programmeOrStudyTrack].otherCountries += 1
      if (!yearlyStats[year][programmeOrStudyTrack].otherCountriesCounts[studentHomeCountry]) {
        yearlyStats[year][programmeOrStudyTrack].otherCountriesCounts[studentHomeCountry] = 0
      }
      yearlyStats[year][programmeOrStudyTrack].otherCountriesCounts[studentHomeCountry] += 1
    }
  }

  const creditCounts: Record<string, number[]> = getYearsObject({
    years: years.filter(year => year !== 'Total'),
    emptyArrays: true,
  })

  for (const studyRight of studyRightsOfProgramme) {
    const studyRightElement = studyRight.studyRightElements.find(element => element.code === studyProgramme)
    if (!includeGraduated && studyRightElement.graduated) {
      continue
    }

    const [firstStudyRightElementWithSamePhase] = getStudyRightElementsWithPhase(studyRight, studyRightElement.phase)
    const hasTransferredToProgramme = firstStudyRightElementWithSamePhase.code !== studyRightElement.code
    if (!includeAllSpecials && hasTransferredToProgramme) {
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
      studyRight,
      hasTransferredToProgramme,
      startedInProgramme,
      studyRightElement
    )

    const studyTrack = studyRightElement.studyTrack?.code ?? null
    if (studyTrack) {
      updateCounts(startYear, studyTrack, studyRight, hasTransferredToProgramme, startedInProgramme, studyRightElement)
    }
    creditCounts[startYear].push(getCreditCount(studyRight.student.credits, startedInProgramme))
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

      for (const field of Object.keys(yearlyStats[year][track])) {
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

  return { mainStatsByYear, mainStatsByTrack, otherCountriesCount, creditCounts }
}

// Goes through the programme and all its studytracks for the said year and adds the wanted stats to the data objects
const getStudytrackDataForTheYear = async ({
  studyprogramme,
  combinedProgramme,
  since,
  settings,
  studytracks,
  year,
  data,
  doCombo,
}) => {
  const { specialGroups: includeAllSpecials, graduated: includeGraduated } = settings
  const { startDate, endDate } = getAcademicYearDates(year, since)

  const { graduationTimes, graduationTimesSecondProg, totalAmounts } = data

  await Promise.all(
    studytracks.map(async track => {
      const codes = studyprogramme === track ? [studyprogramme] : [studyprogramme, track]
      const studentCount = (
        await getCorrectStudentnumbers({
          codes,
          startDate,
          endDate,
          includeAllSpecials,
          includeTransferredTo: includeAllSpecials,
          includeGraduated,
        })
      ).length

      let graduatedByStartdate = []
      let graduatedByStartSecondProg = []
      // Get all the studyrights and students for the calculations
      if (year !== 'Total') {
        // Studentnumbers are fetched based on studystartdate, if it is greater than startdate
        // Thus, computing the bc+ms graduated by startdate based on these studentnumbers does not work.
        graduatedByStartdate = await graduatedStudyRightsByStartDate(track, startDate, endDate, false)
        if (combinedProgramme) {
          graduatedByStartSecondProg = await graduatedStudyRightsByStartDate(
            combinedProgramme,
            startDate,
            endDate,
            true
          )
        }
      }

      // If the track has no stats for that year, it should be removed from the table and dropdown options
      if (studentCount === 0) {
        return
      }

      // Count stats for the graduation time charts grouped by year
      if (!(track in graduationTimes)) {
        graduationTimes[track] = { medians: { basic: [], combo: [] } }
      }
      totalAmounts[track][year] = studentCount
      await getGraduationTimeStats({
        year,
        graduated: graduatedByStartdate,
        track,
        graduationTimes,
        classSize: studentCount,
        doCombo,
      })
      if (combinedProgramme) {
        await getGraduationTimeStats({
          year,
          graduated: graduatedByStartSecondProg,
          track: combinedProgramme,
          graduationTimes: graduationTimesSecondProg,
          classSize: totalAmounts[studyprogramme][year],
          doCombo: true,
        })
      }
    })
  )

  Object.keys(graduationTimes).forEach(track => {
    if (track !== 'goals') {
      const sortedMedians = graduationTimes[track].medians.basic.sort((a, b) => b.name.localeCompare(a.name))
      const sortedMediansCombo = graduationTimes[track].medians.combo.sort((a, b) => b.name.localeCompare(a.name))
      graduationTimes[track].medians.basic = sortedMedians
      graduationTimes[track].medians.combo = sortedMediansCombo
    }
  })

  Object.keys(graduationTimesSecondProg).forEach(track => {
    if (track !== 'goals') {
      const sortedMedians = graduationTimesSecondProg[track].medians.combo.sort((a, b) => b.name.localeCompare(a.name))
      graduationTimesSecondProg[track].medians.combo = sortedMedians
    }
  })
}

const getStudytrackOptions = async (studyProgramme: string) =>
  (
    await SISStudyRightElement.findAll({
      attributes: [[fn('DISTINCT', col('study_track')), 'studyTrack']],
      where: {
        code: studyProgramme,
        studyTrack: { [Op.not]: null },
      },
    })
  )
    .map(studyTrack => studyTrack.toJSON().studyTrack as StudyTrack)
    .reduce<Record<string, Name | string>>(
      (acc, track) => {
        acc[track.code] = track.name
        return acc
      },
      { [studyProgramme]: 'All students of the programme' }
    )

// Creates empty objects for each statistic type, which are then updated with the studytrack data
const getEmptyStatsObjects = (years, studytracks, studyprogramme, combinedProgramme) => {
  const goal = getGoal(studyprogramme)
  const goalSecondProg = getGoal(combinedProgramme)
  const graduationTimes = { goals: { basic: goal, combo: goal + 36 } }
  const graduationTimesSecondProg = {
    [combinedProgramme]: { medians: { basic: [], combo: [] } },
    goals: { basic: goal, combo: goal + goalSecondProg },
  }

  const totalAmounts = {}

  studytracks.forEach(async track => {
    totalAmounts[track] = getYearsObject({ years })
  })

  return { graduationTimes, graduationTimesSecondProg, totalAmounts }
}

// Combines all the data for the Populations and Studytracks -view
// At the moment combined programme is thought to have only one track, the programme itself
export const getStudytrackStatsForStudyprogramme = async ({
  studyprogramme,
  combinedProgramme,
  settings,
}: {
  studyprogramme: string
  combinedProgramme?: string
  settings: { graduated: boolean; specialGroups: boolean }
}) => {
  const isAcademicYear = true
  const includeYearsCombined = true
  const since = getStartDate(isAcademicYear)
  const years = getYearsArray(since.getFullYear(), isAcademicYear, includeYearsCombined)

  const studytrackOptions = await getStudytrackOptions(studyprogramme)

  const studytracks = Object.keys(studytrackOptions)

  const data = getEmptyStatsObjects(years, studytracks, studyprogramme, combinedProgramme)
  const doCombo = studyprogramme.startsWith('MH') && !['MH30_001', 'MH30_003'].includes(studyprogramme)
  const { mainStatsByTrack, mainStatsByYear, otherCountriesCount, creditCounts } = await getMainStatsByTrackAndYear(
    years,
    studyprogramme,
    settings.graduated,
    settings.specialGroups,
    combinedProgramme
  )
  const yearsReversed = [...years].reverse()
  for (const year of yearsReversed) {
    await getStudytrackDataForTheYear({
      studyprogramme,
      combinedProgramme,
      since,
      settings,
      studytracks,
      year,
      data,
      doCombo,
    })
  }

  delete data.totalAmounts

  const getCorrectCombinedTitles = () => {
    if (['MH90_001'].includes(combinedProgramme!)) return tableTitles.studytracksCombined.licentiate
    return tableTitles.studytracksCombined.master
  }
  const graduatedTitles = combinedProgramme ? getCorrectCombinedTitles() : tableTitles.studytracksBasic
  return {
    id: combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme,
    years,
    ...data,
    creditCounts,
    otherCountriesCount,
    mainStatsByTrack,
    mainStatsByYear,
    doCombo,
    studytrackOptions,
    includeGraduated: settings.graduated,
    populationTitles: [...tableTitles.studytracksStart, ...graduatedTitles, ...tableTitles.studytracksEnd],
  }
}
