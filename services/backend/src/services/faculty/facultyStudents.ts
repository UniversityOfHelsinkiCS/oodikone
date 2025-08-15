import { Unarray } from '@oodikone/shared/types'
import { getStudyTrackStats, setStudyTrackStats } from '../analyticsService'
import { getPercentage, tableTitles } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsInProgramme } from '../studyProgramme/studyRightFinders'
import { getStudyTrackStatsForStudyProgramme } from '../studyProgramme/studyTrackStats'
import type { ProgrammesOfOrganization } from './faculty'

type StudyTrackStats = Awaited<ReturnType<typeof getStudyTrackStatsForStudyProgramme>>

const calculateCombinedStats = (programmeCodes: string[], stats: StudyTrackStats[]) => {
  const facultyTableStats: Record<string, (string | number)[]> = {}
  const facultyTableStatsExtra: Record<string, Record<string, Record<string, number>>> = {}
  const programmeTableStats: Record<string, Record<string, (string | number)[]>> = {}

  for (const programmeCode of programmeCodes) {
    const statsForProgramme = stats.find(programmeStats => programmeStats.id === programmeCode)?.mainStatsByTrack?.[
      programmeCode
    ]

    const programmeOtherCountriesCount = stats.find(programmeStats => programmeStats.id === programmeCode)
      ?.otherCountriesCount?.[programmeCode]

    if (!statsForProgramme) continue

    for (const yearStats of statsForProgramme) {
      if (!(yearStats[0] in facultyTableStats)) {
        facultyTableStats[yearStats[0]] = [yearStats[0]]
      }
      for (let i = 1; i < yearStats.length; i++) {
        if (facultyTableStats[yearStats[0]][i] == null) {
          facultyTableStats[yearStats[0]].push(yearStats[i])
        } else if (typeof facultyTableStats[yearStats[0]][i] === 'number') {
          ;(facultyTableStats[yearStats[0]][i] as number) += yearStats[i] as number
        } else {
          const allStudentsCount = facultyTableStats[yearStats[0]][1]
          const categoryStudentsCount = facultyTableStats[yearStats[0]][i - 1]
          facultyTableStats[yearStats[0]][i] = getPercentage(categoryStudentsCount, allStudentsCount)
        }
      }

      if (!(programmeCode in programmeTableStats)) {
        programmeTableStats[programmeCode] = {}
      }
      if (!(yearStats[0] in programmeTableStats[programmeCode])) {
        programmeTableStats[programmeCode][yearStats[0]] = yearStats.slice(1)
      }
    }

    if (!programmeOtherCountriesCount) continue
    for (const [year, countryStats] of Object.entries(programmeOtherCountriesCount)) {
      if (!(year in facultyTableStatsExtra)) {
        facultyTableStatsExtra[year] = {}
      }
      facultyTableStatsExtra[year][programmeCode] = countryStats
    }
  }

  return { facultyTableStats, facultyTableStatsExtra, programmeTableStats }
}

export const combineFacultyStudents = async (
  code: string,
  programmes: ProgrammesOfOrganization,
  specialGroups: 'SPECIAL_INCLUDED' | 'SPECIAL_EXCLUDED',
  graduated: 'GRADUATED_INCLUDED' | 'GRADUATED_EXCLUDED'
) => {
  let years: string[] = []
  const programmeCodes = programmes.map(programme => programme.code)
  const newStats: StudyTrackStats[] = []

  for (const studyProgrammeCode of programmeCodes) {
    const statsFromRedis = await getStudyTrackStats(studyProgrammeCode, null, graduated, specialGroups)
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      if (!years.length) {
        years = statsFromRedis.years
      }
      continue
    }
    const studyRightsOfProgramme = await getStudyRightsInProgramme(studyProgrammeCode, false, true)
    const updatedStats = await getStudyTrackStatsForStudyProgramme({
      studyProgramme: studyProgrammeCode,
      settings: {
        graduated: graduated === 'GRADUATED_INCLUDED',
        specialGroups: specialGroups === 'SPECIAL_INCLUDED',
      },
      studyRightsOfProgramme,
    })
    await setStudyTrackStats(updatedStats, graduated, specialGroups)
    if (!years.length) {
      years = updatedStats.years
    }
    newStats.push(updatedStats)
  }

  const { facultyTableStats, facultyTableStatsExtra, programmeTableStats } = calculateCombinedStats(
    programmeCodes,
    newStats
  )

  const programmeNames = programmes.reduce<
    Record<string, Pick<Unarray<ProgrammesOfOrganization>, 'code' | 'name' | 'degreeProgrammeType' | 'progId'>>
  >((acc, { code, name, degreeProgrammeType, progId }) => {
    acc[code] = { name, code, degreeProgrammeType, progId }
    return acc
  }, {})

  const studentsData = {
    id: code,
    years: years.sort((a, b) => {
      if (a === 'Total') return 1
      if (b === 'Total') return -1

      const yearA = parseInt(a.split(' - ')[0], 10)
      const yearB = parseInt(b.split(' - ')[0], 10)

      return yearB - yearA
    }),
    facultyTableStats,
    facultyTableStatsExtra,
    programmeStats: programmeTableStats,
    titles: [...tableTitles.studytracksStart, ...tableTitles.studytracksBasic, ...tableTitles.studytracksEnd],
    programmeNames,
  }
  return studentsData
}
