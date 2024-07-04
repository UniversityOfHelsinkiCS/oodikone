const { setCreditStats } = require('../analyticsService')
const { computeCreditsProduced } = require('../providerCredits')
const { findFacultyProgrammeCodes } = require('./faculty')
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

const updateFacultyOverview = async (faculty, statsType) => {
  const calendarNewSpecial = {
    yearType: 'CALENDAR_YEAR',
    programmeFilter: 'NEW_STUDY_PROGRAMMES',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const calendarNewSpecialOut = {
    yearType: 'CALENDAR_YEAR',
    programmeFilter: 'NEW_STUDY_PROGRAMMES',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const calendarAllSpecial = {
    yearType: 'CALENDAR_YEAR',
    programmeFilter: 'ALL_PROGRAMMES',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const calendarAllSpecialOut = {
    yearType: 'CALENDAR_YEAR',
    programmeFilter: 'ALL_PROGRAMMES',
    specialGroups: 'SPECIAL_EXCLUDED',
  }
  const academicNewSpecial = {
    yearType: 'ACADEMIC_YEAR',
    programmeFilter: 'NEW_STUDY_PROGRAMMES',
    specialGroups: 'SPECIAL_INCLUDED',
  }

  const academicAllSpecial = {
    yearType: 'ACADEMIC_YEAR',
    programmeFilter: 'ALL_PROGRAMMES',
    specialGroups: 'SPECIAL_INCLUDED',
  }

  const academicNewSpecialOut = {
    yearType: 'ACADEMIC_YEAR',
    programmeFilter: 'NEW_STUDY_PROGRAMMES',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const academicAllSpecialOut = {
    yearType: 'ACADEMIC_YEAR',
    programmeFilter: 'ALL_PROGRAMMES',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const options = [
    calendarNewSpecial,
    calendarAllSpecial,
    academicNewSpecial,
    academicAllSpecial,
    calendarNewSpecialOut,
    calendarAllSpecialOut,
    academicNewSpecialOut,
    academicAllSpecialOut,
  ]
  let allProgrammes = []
  let newProgrammes = []
  const allProgrammeCodes = []

  const all = await findFacultyProgrammeCodes(faculty, 'ALL_PROGRAMMES')
  const onlyNew = await findFacultyProgrammeCodes(faculty, 'NEW_STUDY_PROGRAMMES')
  allProgrammes = await setFacultyProgrammes(faculty, all, 'ALL_PROGRAMMES')
  newProgrammes = await setFacultyProgrammes(faculty, onlyNew, 'NEW_STUDY_PROGRAMMES')
  allProgrammes?.data.forEach(prog => allProgrammeCodes.push(prog.code))

  for (const option of options) {
    const { yearType, programmeFilter, specialGroups } = option
    if (statsType === 'ALL' || statsType === 'STUDENT') {
      const updatedStudentInfo = await combineFacultyBasics(
        faculty,
        programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
        yearType,
        allProgrammeCodes,
        programmeFilter,
        specialGroups
      )
      await setBasicStats(updatedStudentInfo, option.yearType, option.programmeFilter, option.specialGroups)
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

  const updatedTimesAll = await countGraduationTimes(faculty, 'ALL_PROGRAMMES')
  await setGraduationStats(updatedTimesAll, 'ALL_PROGRAMMES')
  const updatedTimesNew = await countGraduationTimes(faculty, 'NEW_STUDY_PROGRAMMES')
  await setGraduationStats(updatedTimesNew, 'NEW_STUDY_PROGRAMMES')
  return 'OK'
}

const updateFacultyProgressOverview = async faculty => {
  const specialGraduated = {
    specialGroups: 'SPECIAL_INCLUDED',
    graduated: 'GRADUATED_INCLUDED',
  }
  const specialNotGraduated = {
    specialGroups: 'SPECIAL_INCLUDED',
    graduated: 'GRADUATED_EXCLUDED',
  }
  const notSpecialGraduated = {
    specialGroups: 'SPECIAL_EXCLUDED',
    graduated: 'GRADUATED_INCLUDED',
  }
  const notSpecialNotGraduated = {
    specialGroups: 'SPECIAL_EXCLUDED',
    graduated: 'GRADUATED_EXCLUDED',
  }
  const options = [specialGraduated, specialNotGraduated, notSpecialGraduated, notSpecialNotGraduated]

  let newProgrammes = []
  const onlyNew = await findFacultyProgrammeCodes(faculty, 'NEW_STUDY_PROGRAMMES')
  newProgrammes = await setFacultyProgrammes(faculty, onlyNew, 'NEW_STUDY_PROGRAMMES')

  for (const option of options) {
    const { specialGroups, graduated } = option
    const updateFacultyStudentStats = await combineFacultyStudents(
      faculty,
      newProgrammes.data,
      specialGroups,
      graduated
    )
    await setFacultyStudentStats(updateFacultyStudentStats, specialGroups, graduated)
    const updateFacultyProgressStats = await combineFacultyStudentProgress(
      faculty,
      newProgrammes.data,
      specialGroups,
      graduated
    )
    await setFacultyProgressStats(updateFacultyProgressStats, specialGroups, graduated)
  }
  return 'OK'
}

module.exports = { updateFacultyOverview, updateFacultyProgressOverview }
