import { cloneDeep, omit } from 'lodash'

import { Name } from '../../types'
import { getGraduationStats, getStudytrackStats, setGraduationStats, setStudytrackStats } from '../analyticsService'
import { getGraduationStatsForStudytrack, GraduationTimes } from '../studyProgramme/studyProgrammeGraduations'
import { getMedian } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsInProgramme } from '../studyProgramme/studyRightFinders'
import {
  getStudytrackStatsForStudyprogramme,
  ProgrammeOrStudyTrackGraduationStats,
} from '../studyProgramme/studyTrackStats'
import type { ProgrammesOfOrganization } from './faculty'

type LevelGraduationStats = Omit<GraduationTimes['medians'][number], 'y'> & { median: number }

type ProgrammeStats = {
  data: Array<Omit<LevelGraduationStats, 'times'> & { code: string }>
  programmes: string[]
}

const programmeTypes = {
  'urn:code:degree-program-type:bachelors-degree': 'bachelor',
  'urn:code:degree-program-type:masters-degree': 'master',
  'urn:code:degree-program-type:doctor': 'doctor',
} as const

const getStatsByGraduationYear = async (facultyProgrammes: ProgrammesOfOrganization) => {
  const newStats: Array<Awaited<ReturnType<typeof getGraduationStatsForStudytrack>>> = []
  const medians: Record<string, LevelGraduationStats[]> = {}
  const programmes: { medians: Record<string, Record<string, ProgrammeStats>> } = { medians: {} }

  for (const programme of facultyProgrammes) {
    if (!(programme.degreeProgrammeType in programmeTypes)) {
      continue
    }
    const statsFromRedis = await getGraduationStats(programme.code, '', 'CALENDAR_YEAR', 'SPECIAL_INCLUDED')
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      continue
    }
    const updatedStats = await getGraduationStatsForStudytrack({
      studyprogramme: programme.code,
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
      for (let i = 0; i < graduationTimes.medians.length; i++) {
        medians[level][i].times.push(...graduationTimes.medians[i].times)
        medians[level][i].median = getMedian(medians[level][i].times)
        medians[level][i].amount += graduationTimes.medians[i].amount
        medians[level][i].statistics.onTime += graduationTimes.medians[i].statistics.onTime
        medians[level][i].statistics.yearOver += graduationTimes.medians[i].statistics.yearOver
        medians[level][i].statistics.wayOver += graduationTimes.medians[i].statistics.wayOver
      }
    }

    if (level === 'master' && comboTimes.medians.length) {
      if (!medians.bcMsCombo) {
        medians.bcMsCombo = cloneDeep(comboTimes.medians).map(year => ({ ...omit(year, ['y']), median: year.y }))
      } else {
        for (let i = 0; i < comboTimes.medians.length; i++) {
          medians.bcMsCombo[i].times.push(...comboTimes.medians[i].times)
          medians.bcMsCombo[i].median = getMedian(medians.bcMsCombo[i].times)
          medians.bcMsCombo[i].amount += comboTimes.medians[i].amount
          medians.bcMsCombo[i].statistics.onTime += comboTimes.medians[i].statistics.onTime
          medians.bcMsCombo[i].statistics.yearOver += comboTimes.medians[i].statistics.yearOver
          medians.bcMsCombo[i].statistics.wayOver += comboTimes.medians[i].statistics.wayOver
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
  const newStats: Array<Awaited<ReturnType<typeof getStudytrackStatsForStudyprogramme>>> = []
  const medians: Record<string, LevelGraduationStats[]> = {}
  const programmes: { medians: Record<string, Record<string, ProgrammeStats>> } = { medians: {} }
  const classSizes: Record<string, Record<string, number | Record<string, number>>> = { programmes: {} }

  for (const programme of facultyProgrammes) {
    if (!(programme.degreeProgrammeType in programmeTypes)) {
      continue
    }
    const statsFromRedis = await getStudytrackStats(programme.code, '', 'GRADUATED_INCLUDED', 'SPECIAL_EXCLUDED')
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      continue
    }

    const studyRightsOfProgramme = await getStudyRightsInProgramme(programme.code, false, true)
    const updatedStats = await getStudytrackStatsForStudyprogramme({
      studyprogramme: programme.code,
      combinedProgramme: '',
      settings: {
        graduated: true,
        specialGroups: false,
      },
      studyRightsOfProgramme,
    })
    await setStudytrackStats(updatedStats, 'GRADUATED_INCLUDED', 'SPECIAL_EXCLUDED')
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
      for (let i = 0; i < basicStats.length; i++) {
        ;(classSizes[level][basicStats[i].name] as number) += basicStats[i].classSize
        medians[level][i].times.push(...basicStats[i].times)
        medians[level][i].median = getMedian(medians[level][i].times)
        medians[level][i].amount += basicStats[i].amount
        medians[level][i].statistics.onTime += basicStats[i].statistics.onTime
        medians[level][i].statistics.yearOver += basicStats[i].statistics.yearOver
        medians[level][i].statistics.wayOver += basicStats[i].statistics.wayOver
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
        for (let i = 0; i < comboStats.length; i++) {
          ;(classSizes.bcMsCombo[comboStats[i].name] as number) += comboStats[i].classSize
          medians.bcMsCombo[i].times.push(...comboStats[i].times)
          medians.bcMsCombo[i].median = getMedian(medians.bcMsCombo[i].times)
          medians.bcMsCombo[i].amount += comboStats[i].amount
          medians.bcMsCombo[i].statistics.onTime += comboStats[i].statistics.onTime
          medians.bcMsCombo[i].statistics.yearOver += comboStats[i].statistics.yearOver
          medians.bcMsCombo[i].statistics.wayOver += comboStats[i].statistics.wayOver
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
    bcMsCombo: 60,
    master: 24,
    doctor: 48,
    exceptions: {
      MH30_004: 6, // months more
      '420420-ma': 6,
      MH30_001: 12,
      '320011-ma': 12,
      '320001-ma': 12,
      MH30_003: 6,
      '320002-ma': 12,
    },
  }

  if (faculty === 'H90') {
    goals.bcMsCombo += 12
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
