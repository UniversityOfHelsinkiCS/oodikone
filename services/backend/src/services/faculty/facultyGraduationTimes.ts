import { Name, DegreeProgrammeType, FacultyGraduationStatistics, ClassSizes } from '@oodikone/shared/types'
import type {
  GraduationStatistics,
  MedianEntry,
  MediansByCategory,
  MediansByProgrammes,
  ProgrammeGraduationStats,
  ProgrammeMedians,
} from '@oodikone/shared/types'
import { omitKeys } from '@oodikone/shared/util'
import { getGraduationStats, getStudyTrackStats, setGraduationStats, setStudyTrackStats } from '../analyticsService'
import { GraduationTarget } from '../graduationHelpers'
import { getGraduationStatsForStudyTrack } from '../studyProgramme/studyProgrammeGraduations'
import { getMedian } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsInProgramme } from '../studyProgramme/studyRightFinders'
import { getStudyTrackStatsForStudyProgramme } from '../studyProgramme/studyTrackStats'
import type { ProgrammesOfOrganization } from './faculty'

export const programmeTypes = {
  [DegreeProgrammeType.BACHELOR]: 'bachelor',
  [DegreeProgrammeType.MASTER]: 'master',
  [DegreeProgrammeType.DOCTOR]: 'doctor',
} as const

const setYearlyBreakdown = (programmeCode: string, progId: string, level: ProgrammeMedians, year: MedianEntry) => {
  if (year.y === 0) return

  level[year.name] ??= { data: [], programmes: [] }
  level[year.name].programmes.push(programmeCode)
  level[year.name].data.push(
    omitKeys({ ...structuredClone(year), name: progId, programmeCode, median: year.y }, ['y', 'classSize'])
  )
}

const mergeStats = (
  medians: MediansByCategory,
  level: keyof MediansByCategory,
  statsForYear: MedianEntry,
  classSizes?: ClassSizes
) => {
  if (classSizes) {
    classSizes[level][statsForYear.name] ??= 0
    classSizes[level][statsForYear.name] += statsForYear.classSize ?? 0
  }

  const gradStatsForYear = medians[level].find(entry => entry.name === statsForYear.name)

  if (!gradStatsForYear) {
    medians[level].push({ ...omitKeys(structuredClone(statsForYear), ['y']), median: statsForYear.y })
  } else {
    gradStatsForYear.times.push(...statsForYear.times)
    gradStatsForYear.median = getMedian(gradStatsForYear.times)
    gradStatsForYear.amount += statsForYear.amount
    gradStatsForYear.statistics.onTime += statsForYear.statistics.onTime
    gradStatsForYear.statistics.yearOver += statsForYear.statistics.yearOver
    gradStatsForYear.statistics.wayOver += statsForYear.statistics.wayOver
  }
}

const getStatsByGraduationYear = async (
  facultyProgrammes: ProgrammesOfOrganization
): Promise<GraduationStatistics['byGradYear']> => {
  const newStats: Pick<ProgrammeGraduationStats, 'id' | 'graduationTimes' | 'comboTimes'>[] = []
  const medians: MediansByCategory = { bachelor: [], master: [], bcMsCombo: [], doctor: [] }
  const programmes: { medians: MediansByProgrammes } = {
    medians: {
      bachelor: {},
      master: {},
      bcMsCombo: {},
      doctor: {},
    },
  }

  for (const programme of facultyProgrammes) {
    if (!programme.degreeProgrammeType || !(programme.degreeProgrammeType in programmeTypes)) {
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
    const { degreeProgrammeType, progId } = facultyProgrammes.find(({ code }) => code === programmeCode)!
    const level = programmeTypes[degreeProgrammeType as keyof typeof programmeTypes]

    for (const year of graduationTimes.medians) {
      mergeStats(medians, level, year)
      setYearlyBreakdown(programmeCode, progId, programmes.medians[level], year)
    }

    if (level === 'master' && comboTimes.medians.length) {
      for (const year of comboTimes.medians) {
        mergeStats(medians, 'bcMsCombo', year)
        setYearlyBreakdown(programmeCode, progId, programmes.medians.bcMsCombo, year)
      }
    }
  }
  return { medians, programmes }
}

const getStatsByStartYear = async (
  facultyProgrammes: ProgrammesOfOrganization
): Promise<GraduationStatistics['byStartYear'] & Pick<GraduationStatistics, 'classSizes'>> => {
  const classSizes: ClassSizes = { bachelor: {}, master: {}, bcMsCombo: {}, doctor: {}, programmes: {} }
  const newStats: Awaited<ReturnType<typeof getStudyTrackStatsForStudyProgramme>>[] = []
  const medians: MediansByCategory = { bachelor: [], master: [], bcMsCombo: [], doctor: [] }
  const programmes: { medians: MediansByProgrammes } = {
    medians: {
      bachelor: {},
      master: {},
      bcMsCombo: {},
      doctor: {},
    },
  }

  for (const programme of facultyProgrammes) {
    if (!programme.degreeProgrammeType || !(programme.degreeProgrammeType in programmeTypes)) {
      continue
    }
    const statsFromRedis = await getStudyTrackStats(programme.code, null, 'SPECIAL_EXCLUDED')
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      continue
    }

    const studyRightsOfProgramme = await getStudyRightsInProgramme(programme.code, false, true)
    const updatedStats = await getStudyTrackStatsForStudyProgramme({
      studyProgramme: programme.code,
      combinedProgramme: '',
      settings: {
        specialGroups: false,
      },
      studyRightsOfProgramme,
    })
    await setStudyTrackStats(updatedStats, 'SPECIAL_EXCLUDED')
    newStats.push(updatedStats)
  }

  for (const { id: programmeCode, graduationTimes } of newStats) {
    const { degreeProgrammeType, progId } = facultyProgrammes.find(({ code }) => code === programmeCode)!
    const level = programmeTypes[degreeProgrammeType as keyof typeof programmeTypes]

    if (!(programmeCode in graduationTimes)) {
      continue
    }

    const statsForProgramme = graduationTimes[programmeCode]
    const basicStats = statsForProgramme.medians.basic
    const comboStats = statsForProgramme.medians.combo
    const classSizesByYear = basicStats.reduce<Record<string, number>>(
      (acc, year) => ({ ...acc, [year.name]: year.classSize ?? 0 }),
      {}
    )
    classSizes.programmes[programmeCode] = classSizesByYear

    for (const statsForYear of basicStats) {
      mergeStats(medians, level, statsForYear, classSizes)
      setYearlyBreakdown(programmeCode, progId, programmes.medians[level], statsForYear)
    }

    if (level === 'master' && comboStats.length) {
      for (const statsForYear of comboStats) {
        mergeStats(medians, 'bcMsCombo', statsForYear, classSizes)
        setYearlyBreakdown(programmeCode, progId, programmes.medians.bcMsCombo, statsForYear)
      }
    }
  }

  return { medians, programmes, classSizes }
}

export const countGraduationTimes = async (
  facultyCode: string,
  programmesOfFaculty: ProgrammesOfOrganization
): Promise<FacultyGraduationStatistics> => {
  const { medians: mediansByGraduationYear, programmes: programmesByGraduationYear } =
    await getStatsByGraduationYear(programmesOfFaculty)

  const {
    medians: mediansByStartYear,
    programmes: programmesByStartYear,
    classSizes,
  } = await getStatsByStartYear(programmesOfFaculty)

  const goals = {
    bachelor: GraduationTarget.THREE_YEARS,
    bcMsCombo: facultyCode === 'H90' ? GraduationTarget.SIX_YEARS : GraduationTarget.FIVE_YEARS,
    master: GraduationTarget.TWO_YEARS,
    doctor: GraduationTarget.FOUR_YEARS,
    exceptions: {
      // Exceptions are additions to the base amount
      MH30_004: GraduationTarget.HALF_YEAR,
      '420420-ma': GraduationTarget.HALF_YEAR,
      '420074-ma': GraduationTarget.HALF_YEAR,
      '420119-ma': GraduationTarget.HALF_YEAR,
      MH30_001: GraduationTarget.FOUR_YEARS,
      '320011-ma': GraduationTarget.FOUR_YEARS,
      '320001-ma': GraduationTarget.FOUR_YEARS,
      MH30_003: GraduationTarget.THREE_POINT_FIVE_YEARS,
      '320002-ma': GraduationTarget.THREE_POINT_FIVE_YEARS,
      '320009-ma': GraduationTarget.THREE_POINT_FIVE_YEARS,
    } as Record<string, number>,
  }

  const programmeNames = programmesOfFaculty.reduce<Record<string, Name>>((acc, { code, name }) => {
    acc[code] = { ...name }
    return acc
  }, {})

  return {
    id: facultyCode,
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
