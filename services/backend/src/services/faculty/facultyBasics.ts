import { cloneDeep } from 'lodash'

import { DegreeProgrammeType } from '../../types'
import { getBasicStats, setBasicStats } from '../analyticsService'
import { getBasicStatsForStudytrack } from '../studyProgramme/studyProgrammeBasics'
import type { ProgrammesOfOrganization } from './faculty'

type ProgrammeName = { code: string; en?: string; fi?: string; sv?: string }

type StudyTrackBasicStats = Awaited<ReturnType<typeof getBasicStatsForStudytrack>>

const calculateCombinedStats = async (
  facultyProgrammes: ProgrammesOfOrganization,
  isAcademicYear: boolean,
  includeAllSpecials: boolean
) => {
  const statsFromAllProgrammes: StudyTrackBasicStats[] = []
  const studentInfo = {
    graphStats: [] as StudyTrackBasicStats['graphStats'],
    programmeTableStats: {} as Record<string, StudyTrackBasicStats['tableStats']>,
    tableStats: [] as StudyTrackBasicStats['tableStats'],
    titles: ['', 'Started\nstudying', 'Accepted', 'Graduated'],
  }
  if (includeAllSpecials) {
    studentInfo.titles.push('Transferred out\nof programme', 'Transferred into\nprogramme')
  }
  const programmeNames: Record<string, ProgrammeName> = {}
  let years: Array<string | number> = []

  for (const programme of facultyProgrammes) {
    const statsFromRedis = await getBasicStats(
      programme.code,
      null,
      isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
      includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
    )
    if (statsFromRedis) {
      statsFromAllProgrammes.push(statsFromRedis)
      continue
    }
    const updatedStats = await getBasicStatsForStudytrack({
      studyprogramme: programme.code,
      combinedProgramme: '',
      settings: {
        isAcademicYear,
        includeAllSpecials,
      },
    })
    await setBasicStats(
      updatedStats,
      isAcademicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR',
      includeAllSpecials ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
    )
    statsFromAllProgrammes.push(updatedStats)
  }

  const combinedGraphStats: Array<{ name: 'Bachelors' | 'Masters' | 'Doctors' | 'Others'; data?: number[] }> = [
    { name: 'Bachelors' },
    { name: 'Masters' },
    { name: 'Doctors' },
    { name: 'Others' },
  ]
  const combinedProgrammeTableStats: Record<string, Array<Array<string | number>>> = {}
  const combinedTableStats: Array<Array<string | number>> = []
  const degreeProgrammeTypesToInclude = [
    DegreeProgrammeType.BACHELOR,
    DegreeProgrammeType.MASTER,
    DegreeProgrammeType.DOCTOR,
  ]
  const degreeToIndex = {
    [DegreeProgrammeType.BACHELOR]: 0,
    [DegreeProgrammeType.MASTER]: 1,
    [DegreeProgrammeType.DOCTOR]: 2,
  } as const

  for (const stats of statsFromAllProgrammes) {
    if (!years.length) {
      years = [...stats.years]
    }
    const { degreeProgrammeType, progId, name, code } = facultyProgrammes.find(({ code }) => code === stats.id)!
    programmeNames[progId] = { ...name, code }
    const graduatedStats = stats.graphStats.find(({ name }) => name === 'Graduated')!
    const correctIndex =
      degreeProgrammeType != null && degreeProgrammeType in degreeToIndex
        ? degreeToIndex[degreeProgrammeType as keyof typeof degreeToIndex]
        : 3
    if (!combinedGraphStats[correctIndex].data) {
      combinedGraphStats[correctIndex].data = [...graduatedStats.data]
    } else {
      for (let i = 0; i < graduatedStats.data.length; i++) {
        combinedGraphStats[correctIndex].data[i] += graduatedStats.data[i]
      }
    }
    const tableStatsForProgramme = stats.tableStats.map(([year, , , graduated]) => [
      year,
      graduated,
      degreeProgrammeType === DegreeProgrammeType.BACHELOR ? graduated : 0,
      degreeProgrammeType === DegreeProgrammeType.MASTER ? graduated : 0,
      degreeProgrammeType === DegreeProgrammeType.DOCTOR ? graduated : 0,
      degreeProgrammeType !== null && !degreeProgrammeTypesToInclude.includes(degreeProgrammeType) ? graduated : 0,
    ])
    combinedProgrammeTableStats[progId] = tableStatsForProgramme

    if (!combinedTableStats.length) {
      combinedTableStats.push(...cloneDeep(tableStatsForProgramme))
    } else {
      for (let i = 0; i < tableStatsForProgramme.length; i++) {
        for (let j = 1; j < tableStatsForProgramme[i].length; j++) {
          ;(combinedTableStats[i][j] as number) += tableStatsForProgramme[i][j] as number
        }
      }
    }
    if (!studentInfo.graphStats.length) {
      studentInfo.graphStats = cloneDeep(stats.graphStats)
      if (includeAllSpecials) {
        studentInfo.graphStats.find(({ name }) => name === 'Transferred away')!.name = 'Transferred out of programme'
        studentInfo.graphStats.find(({ name }) => name === 'Transferred to')!.name = 'Transferred into programme'
      }
    } else {
      for (let i = 0; i < stats.graphStats.length; i++) {
        for (let j = 0; j < stats.graphStats[i].data.length; j++) {
          studentInfo.graphStats[i].data[j] += stats.graphStats[i].data[j]
        }
      }
    }
    studentInfo.programmeTableStats[progId] = cloneDeep(stats.tableStats)
    if (!studentInfo.tableStats.length) {
      studentInfo.tableStats = cloneDeep(stats.tableStats)
    } else {
      for (let i = 0; i < stats.tableStats.length; i++) {
        for (let j = 1; j < stats.tableStats[i].length; j++) {
          studentInfo.tableStats[i][j] += stats.tableStats[i][j]
        }
      }
    }
  }

  return {
    years,
    programmeNames,
    studentInfo,
    graduationInfo: {
      graphStats: combinedGraphStats,
      programmeTableStats: combinedProgrammeTableStats,
      tableStats: combinedTableStats,
      titles: ['', 'All', 'Bachelors', 'Masters', 'Doctors', 'Others'],
    },
  }
}

export const combineFacultyBasics = async (
  faculty: string,
  programmes: ProgrammesOfOrganization,
  yearType: 'ACADEMIC_YEAR' | 'CALENDAR_YEAR',
  special: 'SPECIAL_INCLUDED' | 'SPECIAL_EXCLUDED'
) => {
  const isAcademicYear = yearType === 'ACADEMIC_YEAR'
  const includeAllSpecials = special === 'SPECIAL_INCLUDED'

  const { graduationInfo, years, programmeNames, studentInfo } = await calculateCombinedStats(
    programmes,
    isAcademicYear,
    includeAllSpecials
  )

  return {
    graduationInfo,
    id: faculty,
    programmeNames,
    studentInfo,
    years,
  }
}
