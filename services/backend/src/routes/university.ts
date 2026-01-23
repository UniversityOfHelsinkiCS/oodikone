import { Request, Response, Router } from 'express'
import { cloneDeep } from 'lodash'

import { Graduated, NameWithCode } from '@oodikone/shared/types'
import { serviceProvider } from '../config'
import { magicFacultyCode } from '../config/organizationConstants'
import { OrganizationModel } from '../models'
import { getDegreeProgrammesOfFaculty } from '../services/faculty/faculty'
import { countGraduationTimes, LevelGraduationStats } from '../services/faculty/facultyGraduationTimes'
import { getSortedFaculties } from '../services/faculty/facultyHelpers'
import {
  getFacultyProgressStats,
  getGraduationStats,
  setGraduationStats,
  setFacultyProgressStats,
} from '../services/faculty/facultyService'
import { combineFacultyStudentProgress, FacultyProgressData } from '../services/faculty/facultyStudentProgress'
import { getMedian } from '../services/studyProgramme/studyProgrammeHelpers'
import logger from '../util/logger'

const router = Router()

const degreeNames = ['bachelor', 'bachelorMaster', 'master', 'doctor'] as const

const getProgrammeNames = (faculties: OrganizationModel[]) => {
  return faculties.reduce<Record<string, NameWithCode>>((obj, faculty) => {
    const { name, code } = faculty.toJSON()
    obj[faculty.code] = { code, ...name }
    return obj
  }, {})
}

interface GetProgressStatsRequest extends Request {
  query: {
    specialsIncluded: 'true' | 'false'
    graduated: Graduated
  }
}

router.get('/allprogressstats', async (req: GetProgressStatsRequest, res: Response) => {
  const specialGroups = req.query?.specialsIncluded === 'true' ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const graduated = req.query?.graduated
  const allFaculties = await getSortedFaculties()
  const facultyCodes = allFaculties.map(faculty => faculty.code)
  const codeToData: Record<string, FacultyProgressData> = {}

  for (const facultyCode of facultyCodes) {
    let data = await getFacultyProgressStats(facultyCode, specialGroups, graduated)
    if (!data) {
      logger.info(`Data missing from server: Refreshing progress faculty data for faculty ${facultyCode}`)
      const programmes = await getDegreeProgrammesOfFaculty(facultyCode, true)
      data = await combineFacultyStudentProgress(facultyCode, programmes, specialGroups, graduated)
      await setFacultyProgressStats(data, specialGroups, graduated)
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

router.get('/allgraduationstats', async (_req: Request, res: Response) => {
  const degreeNames = ['bachelor', 'bcMsCombo', 'master', 'doctor'] as const
  const allFaculties = await getSortedFaculties()
  const facultyCodes = allFaculties.map(faculty => faculty.code)
  const facultyData: Record<string, Awaited<ReturnType<typeof countGraduationTimes>>> = {}
  const programmeFilter = serviceProvider === 'toska' ? 'NEW_DEGREE_PROGRAMMES' : 'ALL_PROGRAMMES'
  for (const facultyCode of facultyCodes) {
    let data: any = await getGraduationStats(facultyCode, programmeFilter, true)
    if (!data) {
      logger.info(`Data missing from server: Refreshing graduation faculty data for faculty ${facultyCode}`)
      const programmes = await getDegreeProgrammesOfFaculty(facultyCode, true)
      data = await countGraduationTimes(facultyCode, programmes)
      await setGraduationStats(data, programmeFilter)
    }
    facultyData[facultyCode] = data
  }

  const universityData = {
    goals: { bachelor: 36, bcMsCombo: 60, master: 24, doctor: 48 },
    programmeNames: getProgrammeNames(allFaculties),
    byGradYear: {
      medians: {} as Record<string, LevelGraduationStats[]>,
      programmes: {
        medians: {} as Record<
          string,
          Record<string, { programmes: string[]; data: Array<LevelGraduationStats & { name: string; code: string }> }>
        >,
      },
    },
    classSizes: {
      bachelor: null as Record<string, number> | null,
      bcMsCombo: null as Record<string, number> | null,
      master: null as Record<string, number> | null,
      doctor: null as Record<string, number> | null,
      programmes: {} as Record<string, Record<string, Record<string, number>>>,
    },
  }

  const unifyTotals = (facultyData: Record<string, LevelGraduationStats[]>, isLast: boolean) => {
    const mediansForUniversity = universityData.byGradYear.medians
    for (const degree of degreeNames) {
      if (!mediansForUniversity[degree]) mediansForUniversity[degree] = []
      if (!facultyData[degree]) continue
      for (const yearStats of facultyData[degree]) {
        const universityStats = mediansForUniversity[degree]
        const universityYearStats = mediansForUniversity[degree].find(stats => stats.name === yearStats.name)
        if (!universityYearStats) {
          universityStats.push(yearStats)
        } else {
          universityYearStats.times.push(...yearStats.times)
          universityYearStats.amount += yearStats.amount
          universityYearStats.statistics.onTime += yearStats.statistics.onTime
          universityYearStats.statistics.yearOver += yearStats.statistics.yearOver
          universityYearStats.statistics.wayOver += yearStats.statistics.wayOver
          if (isLast) {
            universityYearStats.median = getMedian(universityYearStats.times)
          }
        }
      }
    }
  }

  const unifyProgrammeStats = (facultyData: Record<string, LevelGraduationStats[]>, facultyCode: string) => {
    const mediansForUniversity = universityData.byGradYear.programmes.medians
    for (const degree of degreeNames) {
      if (!facultyData[degree]) continue
      if (!mediansForUniversity[degree]) mediansForUniversity[degree] = {}
      for (const yearData of facultyData[degree]) {
        if (!mediansForUniversity[degree][yearData.name]) {
          mediansForUniversity[degree][yearData.name] = { programmes: [], data: [] }
        }
        const uniYearStats = mediansForUniversity[degree][yearData.name]
        if (!uniYearStats.programmes.find(prog => prog === facultyCode)) {
          uniYearStats.programmes.push(facultyCode)
        }
        const uniYearFacultyStats = uniYearStats.data.find(item => item.code === facultyCode)
        if (!uniYearFacultyStats) {
          uniYearStats.data.push({ ...cloneDeep(yearData), name: facultyCode, code: facultyCode })
        } else {
          uniYearFacultyStats.times.push(...uniYearFacultyStats.times)
          uniYearFacultyStats.median = getMedian(uniYearFacultyStats.times)
          uniYearFacultyStats.amount += yearData.amount
          uniYearFacultyStats.statistics.onTime += yearData.statistics.onTime
          uniYearFacultyStats.statistics.yearOver += yearData.statistics.yearOver
          uniYearFacultyStats.statistics.wayOver += yearData.statistics.wayOver
        }
      }
    }
  }

  for (let i = 0; i < facultyCodes.length; i++) {
    const facultyCode = facultyCodes[i]
    const data = facultyData[facultyCode]
    unifyTotals(data.byGradYear.medians, i === facultyCodes.length - 1)
    unifyProgrammeStats(data.byGradYear.medians, facultyCode)
    for (const degree of degreeNames) {
      if (!data.classSizes[degree]) {
        continue
      }
      const facultyClassSizes = data.classSizes[degree] as Record<string, number>
      if (!universityData.classSizes[degree]) {
        universityData.classSizes[degree] = facultyClassSizes
      } else {
        Object.entries(facultyClassSizes).forEach(([key, value]) => {
          universityData.classSizes[degree]![key] += value
        })
      }
    }

    const { programmes, ...rest } = data.classSizes
    universityData.classSizes.programmes[facultyCode] = rest as Record<string, Record<string, number>>
  }

  res.status(200).json(universityData)
})

export default router
