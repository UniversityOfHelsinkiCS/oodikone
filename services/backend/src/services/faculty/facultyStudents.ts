import { Unarray } from '../../types'
import { getStudytrackStats, setStudytrackStats } from '../analyticsService'
import { getPercentage, tableTitles } from '../studyProgramme/studyProgrammeHelpers'
import { getStudyRightsInProgramme } from '../studyProgramme/studyRightFinders'
import { getStudytrackStatsForStudyprogramme } from '../studyProgramme/studyTrackStats'
import type { ProgrammesOfOrganization } from './faculty'

type StudyTrackStats = Awaited<ReturnType<typeof getStudytrackStatsForStudyprogramme>>

const calculateCombinedStats = (programmeCodes: string[], stats: StudyTrackStats[]) => {
  const facultyTableStats: Record<string, Array<string | number>> = {}
  const facultyTableStatsExtra: Record<string, Record<string, Record<string, number>>> = {}
  const programmeTableStats: Record<string, Record<string, Array<string | number>>> = {}

  for (const prog of programmeCodes) {
    const statsForProgramme = stats.find(programmeStats => programmeStats.id === prog)?.mainStatsByTrack?.[prog]
    const programmeOtherCountriesCount = stats.find(programmeStats => programmeStats.id === prog)
      ?.otherCountriesCount?.[prog]
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

      if (!(prog in programmeTableStats)) {
        programmeTableStats[prog] = {}
      }
      if (!(yearStats[0] in programmeTableStats[prog])) {
        programmeTableStats[prog][yearStats[0]] = yearStats.slice(1)
      }
    }

    if (!programmeOtherCountriesCount) continue
    for (const [year, countryStats] of Object.entries(programmeOtherCountriesCount)) {
      if (!(year in facultyTableStatsExtra)) {
        facultyTableStatsExtra[year] = {}
      }
      facultyTableStatsExtra[year][prog] = countryStats
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

  for (const studyProgramme of programmeCodes) {
    const statsFromRedis = await getStudytrackStats(studyProgramme, null, graduated, specialGroups)
    if (statsFromRedis) {
      newStats.push(statsFromRedis)
      if (!years.length) {
        years = statsFromRedis.years
      }
      continue
    }
    const studyRightsOfProgramme = await getStudyRightsInProgramme(studyProgramme, false, true)
    const updatedStats = await getStudytrackStatsForStudyprogramme({
      studyProgramme,
      settings: {
        graduated: graduated === 'GRADUATED_INCLUDED',
        specialGroups: specialGroups === 'SPECIAL_INCLUDED',
      },
      studyRightsOfProgramme,
    })
    setStudytrackStats(updatedStats, graduated, specialGroups)
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
