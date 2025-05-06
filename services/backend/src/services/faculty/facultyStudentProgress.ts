import { cloneDeep } from 'lodash'
import moment from 'moment'

import { Graduated, SpecialGroups } from '@oodikone/shared/types'
import { rootOrgId } from '../../config'
import { Unarray } from '../../types'
import { getStudyTrackStats, setStudyTrackStats } from '../analyticsService'
import { getYearsArray } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsInProgramme } from '../studyProgramme/studyRightFinders'
import { getStudyTrackStatsForStudyProgramme } from '../studyProgramme/studyTrackStats'
import { getDegreeProgrammesOfOrganization, ProgrammesOfOrganization } from './faculty'
import { programmeTypes } from './facultyGraduationTimes'

const createLimits = (
  months: number,
  creditsToAdd: number,
  level: 'bachelor' | 'master' | 'doctor'
): Array<[number, number | null]> => {
  if (level === 'doctor') {
    return [
      [40, null],
      [30, 40],
      [20, 30],
      [10, 20],
      [0, null],
    ]
  }
  return [
    [Math.ceil(months * (60 / 12)) + creditsToAdd, null],
    [Math.ceil(months * (45 / 12)) + creditsToAdd, Math.ceil(months * (60 / 12)) + creditsToAdd],
    [Math.ceil(months * (30 / 12)) + creditsToAdd, Math.ceil(months * (45 / 12)) + creditsToAdd],
    [Math.ceil(months * (15 / 12)) + creditsToAdd, Math.ceil(months * (30 / 12)) + creditsToAdd],
    [creditsToAdd + 1, Math.ceil(months * (15 / 12)) + creditsToAdd],
    [creditsToAdd, null],
  ]
}

const createYearlyTitles = (limitList: ReturnType<typeof createLimits>) => {
  const titles: string[] = []
  for (let i = limitList.length - 1; i >= 0; i--) {
    if (limitList[i][0] === 0) {
      titles.push('0 Credits')
    } else if (limitList[i][1] === null) {
      titles.push(`${limitList[0][0]} ≤ Credits`)
    } else {
      titles.push(`${limitList[i][0]} ≤ Credits < ${limitList[i][1]}`)
    }
  }
  return titles
}

const calculateProgressStats = (
  level: 'bachelor' | 'master' | 'bcMs' | 'doctor',
  creditCounts: Record<string, number[]>,
  yearlyTitles: Record<string, string[][]>,
  progressStats: Record<string, Record<string, number[][]>>,
  programmeInfo: Unarray<ProgrammesOfOrganization>
) => {
  const goalMonthsForLevels = { bachelor: 36, master: 24, bcMs: 60, doctor: 48 } as const

  const allYears = Object.keys(creditCounts)
  const limitsForYears = allYears.reduce<Record<string, ReturnType<typeof createLimits>>>((acc, year) => {
    const startDate = new Date(`${year.slice(0, 4)}-08-01`)
    const lastDayOfMonth = moment().endOf('month')
    const months = Math.round(moment.duration(moment(lastDayOfMonth).diff(moment(startDate))).asMonths())
    const goalMonths = goalMonthsForLevels[level]

    acc[year] = createLimits(Math.min(months, goalMonths), 0, level === 'bcMs' ? 'master' : level)
    return acc
  }, {})

  if (level !== 'doctor' && !(level in yearlyTitles)) {
    yearlyTitles[level] = []
    for (const year of Object.values(limitsForYears)) {
      yearlyTitles[level].unshift(createYearlyTitles(year))
    }
  }

  if (!(level in progressStats)) {
    progressStats[level] = {}
  }

  progressStats[level][programmeInfo.progId] = []

  for (const year of Object.keys(creditCounts)) {
    const limit = limitsForYears[year]
    const statsForYear: number[] = new Array(limit.length).fill(0)
    for (const credits of creditCounts[year]) {
      const correctIndex = limit.length - 1 - limit.findIndex(element => credits >= element[0])
      statsForYear[correctIndex] += 1
    }
    progressStats[level][programmeInfo.progId].unshift(statsForYear)
  }
}

export const combineFacultyStudentProgress = async (
  faculty: string,
  programmes: ProgrammesOfOrganization,
  specialGroups: SpecialGroups,
  graduated: Graduated
) => {
  const since = new Date('2017-08-01')
  const statsOfProgrammes: Array<Awaited<ReturnType<typeof getStudyTrackStatsForStudyProgramme>>> = []
  const allDegreeProgrammes = await getDegreeProgrammesOfOrganization(rootOrgId, false)
  const creditCounts: Record<string, Record<string, number[]>> = {}
  const progressStats: Record<string, Record<string, number[][]>> = {}
  const yearlyTitles: Record<string, string[][]> = {}

  for (const { code: studyProgramme } of programmes) {
    const programmeInfo = allDegreeProgrammes.find(programme => programme.code === studyProgramme)
    if (
      !programmeInfo ||
      programmeInfo.degreeProgrammeType == null ||
      !(programmeInfo.degreeProgrammeType in programmeTypes)
    ) {
      continue
    }
    const statsFromRedis = await getStudyTrackStats(studyProgramme, null, graduated, specialGroups)
    if (statsFromRedis) {
      statsOfProgrammes.push(statsFromRedis)
    } else {
      const studyRightsOfProgramme = await getStudyRightsInProgramme(studyProgramme, false, true)
      const updatedStats = await getStudyTrackStatsForStudyProgramme({
        studyProgramme,
        settings: {
          graduated: graduated === 'GRADUATED_INCLUDED',
          specialGroups: specialGroups === 'SPECIAL_INCLUDED',
        },
        studyRightsOfProgramme,
      })
      statsOfProgrammes.push(updatedStats)
      await setStudyTrackStats(updatedStats, graduated, specialGroups)
    }
  }

  const updateCreditCounts = (
    level: 'bachelor' | 'bcMs' | 'master' | 'doctor',
    creditCountsOfProgramme: Record<string, number[]>
  ) => {
    if (!(level in creditCounts)) {
      creditCounts[level] = cloneDeep(creditCountsOfProgramme)
    } else {
      for (const year of Object.keys(creditCountsOfProgramme)) {
        if (!(year in creditCounts[level])) {
          creditCounts[level][year] = cloneDeep(creditCountsOfProgramme[year])
        } else {
          creditCounts[level][year].push(...creditCountsOfProgramme[year])
        }
      }
    }
  }

  for (const stats of statsOfProgrammes) {
    const programmeInfo = allDegreeProgrammes.find(programme => programme.code === stats.id)
    if (
      !programmeInfo ||
      programmeInfo.degreeProgrammeType == null ||
      !(programmeInfo.degreeProgrammeType in programmeTypes)
    ) {
      continue
    }

    const level = programmeTypes[programmeInfo.degreeProgrammeType as keyof typeof programmeTypes]

    updateCreditCounts(level, stats.creditCounts)
    calculateProgressStats(level, stats.creditCounts, yearlyTitles, progressStats, programmeInfo)

    if (level === 'master' && Object.keys(stats.creditCountsCombo).length > 0) {
      updateCreditCounts('bcMs', stats.creditCountsCombo)
      calculateProgressStats('bcMs', stats.creditCountsCombo, yearlyTitles, progressStats, programmeInfo)
    }
  }

  const sortByYear = (a: string, b: string) => parseInt(b.split(' - ')[0], 10) - parseInt(a.split(' - ')[0], 10)

  const result = {
    bachelorsProgStats: progressStats.bachelor,
    mastersProgStats: progressStats.master,
    bcMsProgStats: progressStats.bcMs,
    doctoralProgStats: progressStats.doctor,
    creditCounts: {} as Record<string, Record<string, number[]>>,
    yearlyBachelorTitles: yearlyTitles.bachelor,
    yearlyBcMsTitles: yearlyTitles.bcMs,
    yearlyMasterTitles: yearlyTitles.master,
    programmeNames: programmes.reduce<Record<string, { code: string; en?: string; fi?: string; sv?: string }>>(
      (acc, { code, name, progId }) => {
        acc[progId] = { code, ...name }
        return acc
      },
      {}
    ),
    years: getYearsArray(since.getFullYear(), true, true),
    id: faculty,
  }

  for (const level of Object.keys(creditCounts)) {
    for (const year of Object.keys(creditCounts[level]).toSorted(sortByYear)) {
      const levelName = level === 'bcMs' ? 'bachelorMaster' : level
      if (!(levelName in result.creditCounts)) {
        result.creditCounts[levelName] = {}
      }
      result.creditCounts[levelName][year] = creditCounts[level][year]
    }
  }

  return result
}

export type FacultyProgressData = Awaited<ReturnType<typeof combineFacultyStudentProgress>>
