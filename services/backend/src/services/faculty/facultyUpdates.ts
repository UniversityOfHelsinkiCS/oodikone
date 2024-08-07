import { StatsType } from '../../types'
import { setCreditStats } from '../analyticsService'
import { computeCreditsProduced } from '../providerCredits'
import { getDegreeProgrammesOfFaculty } from './faculty'
import { combineFacultyBasics } from './facultyBasics'
import { countGraduationTimes } from './facultyGraduationTimes'
import {
  setBasicStats,
  setFacultyProgrammes,
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
const programmeFilterOptions = ['ALL_PROGRAMMES', 'NEW_STUDY_PROGRAMMES'] as const
const graduatedOptions = ['GRADUATED_INCLUDED', 'GRADUATED_EXCLUDED'] as const

export const updateFacultyOverview = async (facultyCode: string, statsType: StatsType) => {
  const all = await getDegreeProgrammesOfFaculty(facultyCode, false)
  const onlyNew = await getDegreeProgrammesOfFaculty(facultyCode, true)

  for (const yearType of yearOptions) {
    for (const specialGroups of specialGroupOptions) {
      for (const programmeFilter of programmeFilterOptions) {
        if (statsType === 'ALL' || statsType === 'STUDENT') {
          const updatedStudentInfo = await combineFacultyBasics(
            facultyCode,
            programmeFilter === 'NEW_STUDY_PROGRAMMES' ? onlyNew : all,
            yearType,
            specialGroups
          )
          await setBasicStats(updatedStudentInfo, yearType, programmeFilter, specialGroups)
        }
        if ((statsType === 'ALL' || statsType === 'CREDITS') && specialGroups !== 'SPECIAL_EXCLUDED') {
          const updatedCredits = await computeCreditsProduced(
            facultyCode,
            yearType === 'ACADEMIC_YEAR',
            specialGroups === 'SPECIAL_INCLUDED'
          )
          await setCreditStats(updatedCredits, yearType === 'ACADEMIC_YEAR', specialGroups === 'SPECIAL_INCLUDED')
        }
        if (statsType === 'ALL' || statsType === 'THESIS') {
          const updateThesisWriters = await combineFacultyThesisWriters(
            facultyCode,
            programmeFilter === 'NEW_STUDY_PROGRAMMES' ? onlyNew : all,
            yearType,
            specialGroups
          )
          await setThesisWritersStats(updateThesisWriters, yearType, programmeFilter, specialGroups)
        }
      }
    }
  }

  const updatedTimesAll = await countGraduationTimes(facultyCode, all)
  await setGraduationStats(updatedTimesAll, 'ALL_PROGRAMMES')
  const updatedTimesNew = await countGraduationTimes(facultyCode, onlyNew)
  await setGraduationStats(updatedTimesNew, 'NEW_STUDY_PROGRAMMES')
  return 'OK'
}

export const updateFacultyProgressOverview = async (facultyCode: string) => {
  const onlyNew = await getDegreeProgrammesOfFaculty(facultyCode, true)
  const newProgrammes = await setFacultyProgrammes(facultyCode, onlyNew, 'NEW_STUDY_PROGRAMMES')

  for (const graduated of graduatedOptions) {
    for (const specialGroups of specialGroupOptions) {
      const updateFacultyStudentStats = await combineFacultyStudents(facultyCode, onlyNew, specialGroups, graduated)
      await setFacultyStudentStats(updateFacultyStudentStats, specialGroups, graduated)
      const updateFacultyProgressStats = await combineFacultyStudentProgress(
        facultyCode,
        newProgrammes?.data,
        specialGroups,
        graduated
      )
      await setFacultyProgressStats(updateFacultyProgressStats, specialGroups, graduated)
    }
  }

  return 'OK'
}
