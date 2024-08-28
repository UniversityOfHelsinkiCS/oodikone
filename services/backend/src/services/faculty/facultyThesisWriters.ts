import { cloneDeep } from 'lodash'

import { DegreeProgrammeType } from '../../types'
import { getGraduationStats, setGraduationStats } from '../analyticsService'
import { getGraduationStatsForStudytrack } from '../studyProgramme/studyProgrammeGraduations'
import { getDegreeProgrammesOfFaculty, ProgrammesOfOrganization } from './faculty'

type ProgrammeName = {
  code: string
  en?: string
  fi?: string
  sv?: string
}

const calculateCombinedStats = async (
  isAcademicYear: boolean,
  includeAllSpecials: boolean,
  facultyProgrammes: ProgrammesOfOrganization
) => {
  const degreeProgrammeTypesToInclude = [DegreeProgrammeType.BACHELOR, DegreeProgrammeType.MASTER]

  const combinedGraphStats: Array<{ name: 'Bachelors' | 'Masters'; data?: number[] }> = [
    { name: 'Bachelors' },
    { name: 'Masters' },
  ]
  const programmeTableStats: Record<string, Array<Array<string | number>>> = {}

  const newStats: Array<Awaited<ReturnType<typeof getGraduationStatsForStudytrack>>> = []
  const combinedTableStats: Array<Array<string | number>> = []
  let years: Array<string | number> = []
  const programmeNames: Record<string, ProgrammeName> = {}

  for (const programme of facultyProgrammes) {
    if (
      programme.degreeProgrammeType == null ||
      !degreeProgrammeTypesToInclude.includes(programme.degreeProgrammeType)
    ) {
      continue
    }
    const statsFromRedis = await getGraduationStats(
      programme.code,
      null,
      isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
      includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
    )
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      continue
    }
    const updatedStats = await getGraduationStatsForStudytrack({
      studyprogramme: programme.code,
      combinedProgramme: '',
      settings: {
        isAcademicYear,
        includeAllSpecials,
      },
    })
    await setGraduationStats(
      updatedStats,
      isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
      includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
    )
    newStats.push(updatedStats)
  }

  for (const { id, graphStats, tableStats, years: yearsFromStats } of newStats) {
    if (!years.length) {
      years = [...yearsFromStats]
    }
    const { degreeProgrammeType, progId, name, code } = facultyProgrammes.find(({ code }) => code === id)!
    programmeNames[progId] = { ...name, code }
    const thesisStats = graphStats.find(({ name }) => name === 'Wrote thesis')!
    const isBachelor = degreeProgrammeType === DegreeProgrammeType.BACHELOR
    const isMaster = degreeProgrammeType === DegreeProgrammeType.MASTER
    const correctIndex = isBachelor ? 0 : 1

    if (thesisStats) {
      if (!combinedGraphStats[correctIndex].data) {
        combinedGraphStats[correctIndex].data = [...thesisStats.data]
      } else {
        for (let i = 0; i < thesisStats.data.length; i++) {
          combinedGraphStats[correctIndex].data[i] += thesisStats.data[i]
        }
      }
    }

    const tableStatsForProgramme = tableStats.map(([year, , wroteThesis]) => [
      year,
      wroteThesis,
      isBachelor ? wroteThesis : 0,
      isMaster ? wroteThesis : 0,
    ])
    programmeTableStats[progId] = tableStatsForProgramme

    if (!combinedTableStats.length) {
      combinedTableStats.push(...cloneDeep(tableStatsForProgramme))
    } else {
      for (let i = 0; i < tableStatsForProgramme.length; i++) {
        for (let j = 1; j < tableStatsForProgramme[i].length; j++) {
          ;(combinedTableStats[i][j] as number) += tableStatsForProgramme[i][j] as number
        }
      }
    }
  }

  return {
    graphStats: combinedGraphStats,
    programmeTableStats,
    tableStats: combinedTableStats,
    years,
    programmeNames,
  }
}

export const combineFacultyThesisWriters = async (
  faculty: string,
  facultyProgrammes: Awaited<ReturnType<typeof getDegreeProgrammesOfFaculty>>,
  yearType: 'ACADEMIC_YEAR' | 'CALENDAR_YEAR',
  specialGroups: 'SPECIAL_INCLUDED' | 'SPECIAL_EXCLUDED'
) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = specialGroups === 'SPECIAL_INCLUDED'

  const { graphStats, programmeTableStats, tableStats, years, programmeNames } = await calculateCombinedStats(
    isAcademicYear,
    includeAllSpecials,
    facultyProgrammes
  )

  return {
    id: faculty,
    years,
    tableStats,
    graphStats,
    programmeTableStats,
    titles: ['', 'All', 'Bachelors', 'Masters'],
    programmeNames,
    status: 'Done',
    lastUpdated: '',
  }
}
