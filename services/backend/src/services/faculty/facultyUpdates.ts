import { StatsType } from '@oodikone/shared/types'
import { setCreditStats } from '../analyticsService'
import { computeCreditsProduced } from '../providerCredits'
import { getDegreeProgrammesOfFaculty } from './faculty'
import { combineFacultyBasics } from './facultyBasics'
import { countGraduationTimes } from './facultyGraduationTimes'
import {
  setBasicStats,
  setFacultyProgressStats,
  setFacultyStudentStats,
  setGraduationStats,
  setThesisWritersStats,
} from './facultyService'
import { combineFacultyStudentProgress } from './facultyStudentProgress'
import { combineFacultyStudents } from './facultyStudents'
import { combineFacultyThesisWriters } from './facultyThesisWriters'

const yearOptions = ['CALENDAR_YEAR', 'ACADEMIC_YEAR'] as const
const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED'] as const
const programmeFilterOptions = ['ALL_PROGRAMMES', 'NEW_DEGREE_PROGRAMMES'] as const

export const updateFacultyOverview = async (facultyCode: string, statsType: StatsType) => {
  for (const programmeFilter of programmeFilterOptions) {
    const programmes = await getDegreeProgrammesOfFaculty(facultyCode, programmeFilter === 'NEW_DEGREE_PROGRAMMES')

    for (const yearType of yearOptions) {
      for (const specialGroups of specialGroupOptions) {
        if (statsType === 'ALL' || statsType === 'STUDENT') {
          const updatedStudentInfo = await combineFacultyBasics(facultyCode, programmes, yearType, specialGroups)
          await setBasicStats(updatedStudentInfo, yearType, programmeFilter, specialGroups)
        }
        if ((statsType === 'ALL' || statsType === 'CREDITS') && specialGroups !== 'SPECIAL_EXCLUDED') {
          const updatedCredits = await computeCreditsProduced(facultyCode, yearType === 'ACADEMIC_YEAR')
          await setCreditStats(updatedCredits, yearType === 'ACADEMIC_YEAR', specialGroups === 'SPECIAL_INCLUDED')
        }
        if (statsType === 'ALL' || statsType === 'THESIS') {
          const updateThesisWriters = await combineFacultyThesisWriters(
            facultyCode,
            programmes,
            yearType,
            specialGroups
          )
          await setThesisWritersStats(updateThesisWriters, yearType, programmeFilter, specialGroups)
        }
      }
    }

    const updatedTimes = await countGraduationTimes(facultyCode, programmes)
    await setGraduationStats(updatedTimes, programmeFilter)
  }

  return 'OK'
}

export const updateFacultyProgressOverview = async (facultyCode: string) => {
  const onlyNew = await getDegreeProgrammesOfFaculty(facultyCode, true)

  for (const specialGroups of specialGroupOptions) {
    const updateFacultyStudentStats = await combineFacultyStudents(facultyCode, onlyNew, specialGroups)
    await setFacultyStudentStats(updateFacultyStudentStats, specialGroups)
    const updateFacultyProgressStats = await combineFacultyStudentProgress(facultyCode, onlyNew, specialGroups)
    await setFacultyProgressStats(updateFacultyProgressStats, specialGroups)
  }

  return 'OK'
}
