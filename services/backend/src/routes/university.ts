import { Request, Response, Router } from 'express'
import { cloneDeep } from 'lodash-es'

import { FacultyGraduationStatistics, Graduated, NameWithCode } from '@oodikone/shared/types'
import { MediansByCategory, UniversityGraduationStatistics } from '@oodikone/shared/types/graduations'
import { magicFacultyCode } from '../config/organizationConstants'
import { OrganizationModel } from '../models'
import { getDegreeProgrammesOfFaculty } from '../services/faculty/faculty'
import { countGraduationTimes } from '../services/faculty/facultyGraduationTimes'
import { getSortedFaculties } from '../services/faculty/facultyHelpers'
import {
  getFacultyProgressStats,
  getGraduationStats,
  setGraduationStats,
  setFacultyProgressStats,
} from '../services/faculty/facultyService'
import { combineFacultyStudentProgress, FacultyProgressData } from '../services/faculty/facultyStudentProgress'
import { GraduationTarget } from '../services/graduationHelpers'
import { getMedian } from '../services/studyProgramme/studyProgrammeHelpers'
import logger from '../util/logger'

const router = Router()

const degreeNames = ['bachelor', 'bachelorMaster', 'master', 'doctor'] as const

const getProgrammeNames = (faculties: OrganizationModel[]) =>
  faculties.reduce<Record<string, NameWithCode>>((obj, faculty) => {
    const { name, code } = faculty.toJSON()
    obj[faculty.code] = { code, ...name }
    return obj
  }, {})

interface GetProgressStatsRequest extends Request {
  query: {
    specialsIncluded: 'true' | 'false'
    graduated: Graduated
  }
}

router.get('/allprogressstats', async (req: GetProgressStatsRequest, res: Response) => {
  const specialGroups = req.query?.specialsIncluded === 'true' ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const allFaculties = await getSortedFaculties()
  const facultyCodes = allFaculties.map(faculty => faculty.code)
  const codeToData: Record<string, FacultyProgressData> = {}

  for (const facultyCode of facultyCodes) {
    let data = await getFacultyProgressStats(facultyCode, specialGroups)
    if (!data) {
      logger.info(`Data missing from server: Refreshing progress faculty data for faculty ${facultyCode}`)
      const programmes = await getDegreeProgrammesOfFaculty(facultyCode, true)
      data = await combineFacultyStudentProgress(facultyCode, programmes, specialGroups)
      await setFacultyProgressStats(data, specialGroups)
    }
    codeToData[facultyCode] = data
  }

  const universityData = {
    years: codeToData[magicFacultyCode].years,
    yearlyBachelorTitles: codeToData[magicFacultyCode].yearlyBachelorTitles,
    yearlyBcMsTitles: codeToData[magicFacultyCode].yearlyBcMsTitles,
    yearlyMasterTitles: codeToData[magicFacultyCode].yearlyMasterTitles,
    programmeNames: getProgrammeNames(allFaculties),
    bachelorsProgStats: {} as Record<string, number[][]>,
    bcMsProgStats: {} as Record<string, number[][]>,
    mastersProgStats: {} as Record<string, number[][]>,
    doctoralProgStats: {} as Record<string, number[][]>,
    creditCounts: {
      bachelor: {} as Record<string, number[]>,
      bachelorMaster: {} as Record<string, number[]>,
      master: {} as Record<string, number[]>,
      doctor: {} as Record<string, number[]>,
    },
    graduatedCount: {
      bachelor: {} as Record<string, number>,
      bachelorMaster: {} as Record<string, number>,
      master: {} as Record<string, number>,
      doctor: {} as Record<string, number>,
    },
  }

  const unifyProgressStats = (progStats: number[][][]) => {
    return progStats.reduce(
      (all, prog) => {
        prog.forEach((yearStats, yearIndex) =>
          yearStats.forEach((category, categoryIndex) => {
            all[yearIndex][categoryIndex] += prog[yearIndex][categoryIndex]
          })
        )
        return all
      },
      progStats[0].map(year => year.map(() => 0))
    )
  }

  for (const facultyCode of facultyCodes) {
    const facultyData = codeToData[facultyCode]
    for (const year of universityData.years.slice(1).reverse()) {
      for (const fieldName of degreeNames) {
        if (!facultyData.creditCounts[fieldName] || Object.keys(facultyData.creditCounts[fieldName]).length === 0)
          continue
        if (!universityData.creditCounts[fieldName][year]) universityData.creditCounts[fieldName][year] = []
        universityData.creditCounts[fieldName][year].push(...facultyData.creditCounts[fieldName][year])
      }

      for (const fieldName of degreeNames) {
        if (!facultyData.graduatedCount[fieldName] || Object.keys(facultyData.graduatedCount[fieldName]).length === 0)
          continue
        if (!universityData.graduatedCount[fieldName][year]) universityData.graduatedCount[fieldName][year] = 0
        universityData.graduatedCount[fieldName][year] += facultyData.graduatedCount[fieldName][year]
      }

      const progStats = ['bachelorsProgStats', 'bcMsProgStats', 'mastersProgStats', 'doctoralProgStats'] as const
      for (const fieldName of progStats) {
        if (Object.keys(facultyData[fieldName] || {}).length === 0) continue
        universityData[fieldName][facultyCode] = unifyProgressStats(Object.values(facultyData[fieldName]))
      }
    }
  }

  res.status(200).json(universityData)
})

router.get('/allgraduationstats', async (_req: Request, res: Response<UniversityGraduationStatistics>) => {
  const degreeTypes = ['bachelor', 'bcMsCombo', 'master', 'doctor'] as const
  /** University view does not support old degree programmes */
  const programmeFilter = 'NEW_DEGREE_PROGRAMMES' as const

  const allFaculties = await getSortedFaculties()
  const facultyCodes = allFaculties.map(faculty => faculty.code)
  const facultyData: Record<string, FacultyGraduationStatistics> = {}

  for (const facultyCode of facultyCodes) {
    let data = await getGraduationStats(facultyCode, programmeFilter, true)

    if (!data) {
      logger.info(`Data missing from redis: Refreshing graduation faculty data for faculty ${facultyCode}`)
      const programmes = await getDegreeProgrammesOfFaculty(facultyCode, true)
      data = await countGraduationTimes(facultyCode, programmes)
      await setGraduationStats(data, programmeFilter)
    }
    facultyData[facultyCode] = data
  }

  const goals: UniversityGraduationStatistics['goals'] = {
    bachelor: GraduationTarget.THREE_YEARS,
    bcMsCombo: GraduationTarget.FIVE_YEARS,
    master: GraduationTarget.TWO_YEARS,
    doctor: GraduationTarget.FOUR_YEARS,
  }
  const programmeNames = getProgrammeNames(allFaculties)

  const byGradYear: UniversityGraduationStatistics['byGradYear'] = {
    medians: {
      bachelor: [],
      bcMsCombo: [],
      master: [],
      doctor: [],
    },
    programmes: {
      medians: {
        bachelor: {},
        bcMsCombo: {},
        master: {},
        doctor: {},
      },
    },
  }
  const classSizes: UniversityGraduationStatistics['classSizes'] = {
    programmes: {},
  }

  /** Computes university level stats */
  const unifyTotals = (facultyData: MediansByCategory, isLast: boolean) => {
    const mediansForUniversity = byGradYear.medians
    for (const degreeType of degreeTypes) {
      if (!facultyData[degreeType]) continue

      for (const facultyYearStats of facultyData[degreeType]) {
        const universityYearStats = mediansForUniversity[degreeType].find(stats => stats.name === facultyYearStats.name)
        if (!universityYearStats) {
          mediansForUniversity[degreeType].push(facultyYearStats)
        } else {
          universityYearStats.times.push(...facultyYearStats.times)
          universityYearStats.amount += facultyYearStats.amount
          universityYearStats.statistics.onTime += facultyYearStats.statistics.onTime
          universityYearStats.statistics.yearOver += facultyYearStats.statistics.yearOver
          universityYearStats.statistics.wayOver += facultyYearStats.statistics.wayOver
          if (isLast) {
            universityYearStats.median = getMedian(universityYearStats.times)
          }
        }
      }
    }
  }

  /** Computes faculty breakdown */
  const unifyFacultyStats = (facultyData: MediansByCategory, facultyCode: string) => {
    const mediansForUniversity = byGradYear.programmes.medians
    for (const degreeType of degreeTypes) {
      if (!facultyData[degreeType]) continue

      for (const facultyYearStats of facultyData[degreeType]) {
        if (!mediansForUniversity[degreeType][facultyYearStats.name]) {
          mediansForUniversity[degreeType][facultyYearStats.name] = { programmes: [], data: [] }
        }
        const uniYearStats = mediansForUniversity[degreeType][facultyYearStats.name]
        if (!uniYearStats.programmes.find(prog => prog === facultyCode)) {
          uniYearStats.programmes.push(facultyCode)
        }
        const uniYearFacultyStats = uniYearStats.data.find(item => item.code === facultyCode)
        if (!uniYearFacultyStats) {
          uniYearStats.data.push({ ...cloneDeep(facultyYearStats), name: facultyCode, code: facultyCode })
        } else {
          uniYearFacultyStats.times.push(...uniYearFacultyStats.times)
          uniYearFacultyStats.median = getMedian(uniYearFacultyStats.times)
          uniYearFacultyStats.amount += facultyYearStats.amount
          uniYearFacultyStats.statistics.onTime += facultyYearStats.statistics.onTime
          uniYearFacultyStats.statistics.yearOver += facultyYearStats.statistics.yearOver
          uniYearFacultyStats.statistics.wayOver += facultyYearStats.statistics.wayOver
        }
      }
    }
  }

  for (let i = 0; i < facultyCodes.length; i++) {
    const facultyCode = facultyCodes[i]
    const data = facultyData[facultyCode]

    unifyTotals(data.byGradYear.medians, i === facultyCodes.length - 1)
    unifyFacultyStats(data.byGradYear.medians, facultyCode)

    const { programmes: _, ...rest } = data.classSizes
    classSizes.programmes[facultyCode] = rest
  }

  res.status(200).json({
    goals,
    programmeNames,
    byGradYear,
    classSizes,
  })
})

export default router
