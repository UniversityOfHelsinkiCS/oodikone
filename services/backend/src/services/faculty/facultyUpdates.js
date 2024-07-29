const { setCreditStats } = require('../analyticsService')
const { computeCreditsProduced } = require('../providerCredits')
const { getDegreeProgrammesOfFaculty } = require('./faculty')
const { combineFacultyBasics } = require('./facultyBasics')
const { countGraduationTimes } = require('./facultyGraduationTimes')
const {
  setBasicStats,
  setFacultyProgrammes,
  setFacultyProgressStats,
  setFacultyStudentStats,
  setGraduationStats,
  setThesisWritersStats,
} = require('./facultyService')
const { combineFacultyStudentProgress } = require('./facultyStudentProgress')
const { combineFacultyStudents } = require('./facultyStudents')
const { combineFacultyThesisWriters } = require('./facultyThesisWriters')

const yearOptions = ['CALENDAR_YEAR', 'ACADEMIC_YEAR']
const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED']
const programmeFilterOptions = ['ALL_PROGRAMMES', 'NEW_STUDY_PROGRAMMES']
const graduatedOptions = ['GRADUATED_INCLUDED', 'GRADUATED_EXCLUDED']

const updateFacultyOverview = async (faculty, statsType) => {
  const allProgrammeCodes = []

  const all = await getDegreeProgrammesOfFaculty(faculty, false)
  const onlyNew = await getDegreeProgrammesOfFaculty(faculty, true)

  const allProgrammes = await setFacultyProgrammes(faculty, all, 'ALL_PROGRAMMES')
  const newProgrammes = await setFacultyProgrammes(faculty, onlyNew, 'NEW_STUDY_PROGRAMMES')
  allProgrammes?.data.forEach(prog => allProgrammeCodes.push(prog.code))

  for (const yearType of yearOptions) {
    for (const specialGroups of specialGroupOptions) {
      for (const programmeFilter of programmeFilterOptions) {
        if (statsType === 'ALL' || statsType === 'STUDENT') {
          const updatedStudentInfo = await combineFacultyBasics(
            faculty,
            programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
            yearType,
            allProgrammeCodes,
            programmeFilter,
            specialGroups
          )
          await setBasicStats(updatedStudentInfo, yearType, programmeFilter, specialGroups)
        }
        if ((statsType === 'ALL' || statsType === 'CREDITS') && specialGroups !== 'SPECIAL_EXCLUDED') {
          const updatedCredits = await computeCreditsProduced(
            faculty,
            yearType === 'ACADEMIC_YEAR',
            specialGroups === 'SPECIAL_INCLUDED'
          )
          await setCreditStats(updatedCredits, yearType === 'ACADEMIC_YEAR', specialGroups === 'SPECIAL_INCLUDED')
        }
        if (statsType === 'ALL' || statsType === 'THESIS') {
          const updateThesisWriters = await combineFacultyThesisWriters(
            faculty,
            programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
            yearType,
            specialGroups
          )
          await setThesisWritersStats(updateThesisWriters, yearType, programmeFilter, specialGroups)
        }
      }
    }
  }

  const updatedTimesAll = await countGraduationTimes(faculty, 'ALL_PROGRAMMES')
  await setGraduationStats(updatedTimesAll, 'ALL_PROGRAMMES')
  const updatedTimesNew = await countGraduationTimes(faculty, 'NEW_STUDY_PROGRAMMES')
  await setGraduationStats(updatedTimesNew, 'NEW_STUDY_PROGRAMMES')
  return 'OK'
}

const updateFacultyProgressOverview = async faculty => {
  const onlyNew = await getDegreeProgrammesOfFaculty(faculty, true)
  const newProgrammes = await setFacultyProgrammes(faculty, onlyNew, 'NEW_STUDY_PROGRAMMES')

  for (const graduated of graduatedOptions) {
    for (const specialGroups of specialGroupOptions) {
      const updateFacultyStudentStats = await combineFacultyStudents(faculty, onlyNew, specialGroups, graduated)
      await setFacultyStudentStats(updateFacultyStudentStats, specialGroups, graduated)
      const updateFacultyProgressStats = await combineFacultyStudentProgress(
        faculty,
        newProgrammes.data,
        specialGroups,
        graduated
      )
      await setFacultyProgressStats(updateFacultyProgressStats, specialGroups, graduated)
    }
  }

  return 'OK'
}

module.exports = { updateFacultyOverview, updateFacultyProgressOverview }
