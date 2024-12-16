import { cloneDeep, omit } from 'lodash'

import { Name } from '@shared/types'
import { DegreeProgrammeType } from '../../types'
import { getGraduationStats, getStudyTrackStats, setGraduationStats, setStudyTrackStats } from '../analyticsService'
import { getGraduationStatsForStudyTrack, GraduationTimes } from '../studyProgramme/studyProgrammeGraduations'
import { getMedian } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsInProgramme } from '../studyProgramme/studyRightFinders'
import {
  getStudyTrackStatsForStudyProgramme,
  ProgrammeOrStudyTrackGraduationStats,
} from '../studyProgramme/studyTrackStats'
import type { ProgrammesOfOrganization } from './faculty'

export type LevelGraduationStats = Omit<GraduationTimes['medians'][number], 'y'> & { median: number }

type ProgrammeStats = {
  data: Array<Omit<LevelGraduationStats, 'times'> & { code: string }>
  programmes: string[]
}

export const programmeTypes = {
  [DegreeProgrammeType.BACHELOR]: 'bachelor',
  [DegreeProgrammeType.MASTER]: 'master',
  [DegreeProgrammeType.DOCTOR]: 'doctor',
} as const

const getStatsByGraduationYear = async (facultyProgrammes: ProgrammesOfOrganization) => {
  const newStats: Array<Awaited<ReturnType<typeof getGraduationStatsForStudyTrack>>> = []
  const medians: Record<string, LevelGraduationStats[]> = {}
  const programmes: { medians: Record<string, Record<string, ProgrammeStats>> } = { medians: {} }

  for (const programme of facultyProgrammes) {
    if (programme.degreeProgrammeType == null || !(programme.degreeProgrammeType in programmeTypes)) {
      continue
    }
    const statsFromRedis = await getGraduationStats(programme.code, '', 'CALENDAR_YEAR', 'SPECIAL_INCLUDED')
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      continue
    }
    const updatedStats = await getGraduationStatsForStudyTrack({
      studyProgramme: programme.code,
      combinedProgramme: '',
      settings: {
        isAcademicYear: false,
        includeAllSpecials: true,
      },
    })
    await setGraduationStats(updatedStats, 'CALENDAR_YEAR', 'SPECIAL_INCLUDED')
    newStats.push(updatedStats)
  }

  for (const { id: programmeCode, graduationTimes, comboTimes } of newStats) {
    const { degreeProgrammeType, progId, code } = facultyProgrammes.find(({ code }) => code === programmeCode)!
    const level = programmeTypes[degreeProgrammeType as keyof typeof programmeTypes]

    if (!medians[level]) {
      medians[level] = cloneDeep(graduationTimes.medians).map(year => ({ ...omit(year, ['y']), median: year.y }))
    } else {
      for (const statsForYear of graduationTimes.medians) {
        const correctYear = medians[level].find(entry => entry.name === statsForYear.name)
        if (!correctYear) {
          medians[level].push({ ...omit(cloneDeep(statsForYear), ['y']), median: statsForYear.y })
          continue
        }
        correctYear.times.push(...statsForYear.times)
        correctYear.median = getMedian(correctYear.times)
        correctYear.amount += statsForYear.amount
        correctYear.statistics.onTime += statsForYear.statistics.onTime
        correctYear.statistics.yearOver += statsForYear.statistics.yearOver
        correctYear.statistics.wayOver += statsForYear.statistics.wayOver
      }
    }

    if (level === 'master' && comboTimes.medians.length) {
      if (!medians.bcMsCombo) {
        medians.bcMsCombo = cloneDeep(comboTimes.medians).map(year => ({ ...omit(year, ['y']), median: year.y }))
      } else {
        for (const statsForYear of comboTimes.medians) {
          const correctYear = medians.bcMsCombo.find(entry => entry.name === statsForYear.name)
          if (!correctYear) {
            medians.bcMsCombo.push({ ...omit(cloneDeep(statsForYear), ['y']), median: statsForYear.y })
            continue
          }
          correctYear.times.push(...statsForYear.times)
          correctYear.median = getMedian(correctYear.times)
          correctYear.amount += statsForYear.amount
          correctYear.statistics.onTime += statsForYear.statistics.onTime
          correctYear.statistics.yearOver += statsForYear.statistics.yearOver
          correctYear.statistics.wayOver += statsForYear.statistics.wayOver
        }
      }
    }

    if (!programmes.medians[level]) {
      programmes.medians[level] = {}
    }

    for (const year of graduationTimes.medians) {
      if (year.y === 0) continue
      if (!programmes.medians[level][year.name]) {
        programmes.medians[level][year.name] = { data: [], programmes: [] }
      }
      programmes.medians[level][year.name].data.push(
        omit({ ...cloneDeep(year), name: progId, code, median: year.y }, ['times', 'y'])
      )
      programmes.medians[level][year.name].programmes.push(code)
    }

    if (level === 'master' && comboTimes.medians.length) {
      if (!programmes.medians.bcMsCombo) {
        programmes.medians.bcMsCombo = {}
      }
      for (const year of comboTimes.medians) {
        if (year.y === 0) continue
        if (!programmes.medians.bcMsCombo[year.name]) {
          programmes.medians.bcMsCombo[year.name] = { data: [], programmes: [] }
        }
        programmes.medians.bcMsCombo[year.name].data.push(
          omit({ ...cloneDeep(year), name: progId, code, median: year.y }, ['times', 'y'])
        )
        programmes.medians.bcMsCombo[year.name].programmes.push(code)
      }
    }
  }
  return { medians, programmes }
}

const getStatsByStartYear = async (facultyProgrammes: ProgrammesOfOrganization) => {
  const newStats: Array<Awaited<ReturnType<typeof getStudyTrackStatsForStudyProgramme>>> = []
  const medians: Record<string, LevelGraduationStats[]> = {}
  const programmes: { medians: Record<string, Record<string, ProgrammeStats>> } = { medians: {} }
  const classSizes: Record<string, Record<string, number | Record<string, number>>> = { programmes: {} }

  for (const programme of facultyProgrammes) {
    if (programme.degreeProgrammeType == null || !(programme.degreeProgrammeType in programmeTypes)) {
      continue
    }
    const statsFromRedis = await getStudyTrackStats(programme.code, '', 'GRADUATED_INCLUDED', 'SPECIAL_EXCLUDED')
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      continue
    }

    const studyRightsOfProgramme = await getStudyRightsInProgramme(programme.code, false, true)
    const updatedStats = await getStudyTrackStatsForStudyProgramme({
      studyProgramme: programme.code,
      combinedProgramme: '',
      settings: {
        graduated: true,
        specialGroups: false,
      },
      studyRightsOfProgramme,
    })
    await setStudyTrackStats(updatedStats, 'GRADUATED_INCLUDED', 'SPECIAL_EXCLUDED')
    newStats.push(updatedStats)
  }

  for (const { id: programmeCode, graduationTimes } of newStats) {
    const { degreeProgrammeType, progId, code } = facultyProgrammes.find(({ code }) => code === programmeCode)!
    const level = programmeTypes[degreeProgrammeType as keyof typeof programmeTypes]
    if (!(programmeCode in graduationTimes)) continue
    const statsForProgramme = graduationTimes[programmeCode] as ProgrammeOrStudyTrackGraduationStats
    const basicStats = statsForProgramme.medians.basic
    const comboStats = statsForProgramme.medians.combo
    const classSizesByYear = basicStats.reduce<Record<string, number>>(
      (acc, year) => ({ ...acc, [year.name]: year.classSize }),
      {}
    )
    classSizes.programmes[code] = classSizesByYear

    if (!medians[level]) {
      medians[level] = cloneDeep(basicStats).map(year => {
        if (!classSizes[level]) {
          classSizes[level] = {}
        }
        classSizes[level][year.name] = year.classSize
        return { ...omit(year, ['y', 'classSize']), median: year.y }
      })
    } else {
      for (const statsForYear of basicStats) {
        const correctYear = medians[level].find(entry => entry.name === statsForYear.name)
        if (!correctYear) {
          medians[level].push({ ...omit(cloneDeep(statsForYear), ['y', 'classSize']), median: statsForYear.y })
          continue
        }
        ;(classSizes[level][statsForYear.name] as number) += statsForYear.classSize
        correctYear.times.push(...statsForYear.times)
        correctYear.median = getMedian(correctYear.times)
        correctYear.amount += statsForYear.amount
        correctYear.statistics.onTime += statsForYear.statistics.onTime
        correctYear.statistics.yearOver += statsForYear.statistics.yearOver
        correctYear.statistics.wayOver += statsForYear.statistics.wayOver
      }
    }

    if (level === 'master' && comboStats.length) {
      if (!medians.bcMsCombo) {
        medians.bcMsCombo = cloneDeep(comboStats).map(year => {
          if (!classSizes.bcMsCombo) {
            classSizes.bcMsCombo = {}
          }
          classSizes.bcMsCombo[year.name] = year.classSize
          return { ...omit(year, ['y', 'classSize']), median: year.y }
        })
      } else {
        for (const statsForYear of comboStats) {
          const correctYear = medians.bcMsCombo.find(entry => entry.name === statsForYear.name)
          if (!correctYear) {
            medians.bcMsCombo.push({ ...omit(cloneDeep(statsForYear), ['y', 'classSize']), median: statsForYear.y })
            continue
          }
          ;(classSizes.bcMsCombo[statsForYear.name] as number) += statsForYear.classSize
          correctYear.times.push(...statsForYear.times)
          correctYear.median = getMedian(correctYear.times)
          correctYear.amount += statsForYear.amount
          correctYear.statistics.onTime += statsForYear.statistics.onTime
          correctYear.statistics.yearOver += statsForYear.statistics.yearOver
          correctYear.statistics.wayOver += statsForYear.statistics.wayOver
        }
      }
    }

    if (!programmes.medians[level]) {
      programmes.medians[level] = {}
    }

    for (const year of basicStats) {
      if (year.y === 0) continue
      if (!programmes.medians[level][year.name]) {
        programmes.medians[level][year.name] = { data: [], programmes: [] }
      }
      programmes.medians[level][year.name].data.push(
        omit({ ...cloneDeep(year), name: progId, code, median: year.y }, ['times', 'y', 'classSize'])
      )
      programmes.medians[level][year.name].programmes.push(code)
    }

    if (level === 'master' && comboStats.length) {
      if (!programmes.medians.bcMsCombo) {
        programmes.medians.bcMsCombo = {}
      }
      for (const year of comboStats) {
        if (year.y === 0) continue
        if (!programmes.medians.bcMsCombo[year.name]) {
          programmes.medians.bcMsCombo[year.name] = { data: [], programmes: [] }
        }
        programmes.medians.bcMsCombo[year.name].data.push(
          omit({ ...cloneDeep(year), name: progId, code, median: year.y }, ['times', 'y', 'classSize'])
        )
        programmes.medians.bcMsCombo[year.name].programmes.push(code)
      }
    }
  }
  return { medians, programmes, classSizes }
}

export const countGraduationTimes = async (faculty: string, programmesOfFaculty: ProgrammesOfOrganization) => {
  const { medians: mediansByGraduationYear, programmes: programmesByGraduationYear } =
    await getStatsByGraduationYear(programmesOfFaculty)
  const {
    medians: mediansByStartYear,
    programmes: programmesByStartYear,
    classSizes,
  } = await getStatsByStartYear(programmesOfFaculty)

  const goals = {
    bachelor: 36,
    bcMsCombo: faculty === 'H90' ? 72 : 60,
    master: 24,
    doctor: 48,
    exceptions: {
      MH30_004: 6, // months more
      '420420-ma': 6,
      '420074-ma': 6,
      '420119-ma': 6,
      MH30_001: 48,
      '320011-ma': 48,
      '320001-ma': 48,
      MH30_003: 42,
      '320002-ma': 42,
      '320009-ma': 42,
    },
  }

  const programmeNames = programmesOfFaculty.reduce<Record<string, Name>>((acc, { code, name }) => {
    acc[code] = { ...name }
    return acc
  }, {})

  return {
    id: faculty,
    goals,
    byGradYear: {
      medians: mediansByGraduationYear,
      programmes: programmesByGraduationYear,
    },
    byStartYear: {
      medians: mediansByStartYear,
      programmes: programmesByStartYear,
    },
    programmeNames,
    classSizes,
  }
}
