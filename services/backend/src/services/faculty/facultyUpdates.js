const logger = require('../../util/logger')
const { findFacultyProgrammeCodes } = require('./faculty')
const { combineFacultyBasics } = require('./facultyBasics')
const { combineFacultyCredits } = require('./facultyCredits')
const { combineFacultyThesisWriters } = require('./facultyThesisWriters')
const { countGraduationTimes } = require('./facultyGraduationTimes')
const {
  setFacultyProgrammes,
  setBasicStats,
  setCreditStats,
  setThesisWritersStats,
  setGraduationStats,
  setFacultyProgressStats,
  setFacultyStudentStats,
} = require('./facultyService')
const { combineFacultyStudentProgress } = require('./facultyStudentProgress')
const { combineFacultyStudents } = require('./facultyStudents')

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
  let allProgrammeCodes = []

  try {
    const all = await findFacultyProgrammeCodes(faculty, 'ALL_PROGRAMMES')
    const onlyNew = await findFacultyProgrammeCodes(faculty, 'NEW_STUDY_PROGRAMMES')
    allProgrammes = await setFacultyProgrammes(faculty, all, 'ALL_PROGRAMMES')
    newProgrammes = await setFacultyProgrammes(faculty, onlyNew, 'NEW_STUDY_PROGRAMMES')
    allProgrammes?.data.forEach(prog => allProgrammeCodes.push(prog.code))
  } catch (e) {
    logger.error(`Faculty updates: programme stats failed with error: ${e}`)
  }

  for (const option of options) {
    const { yearType, programmeFilter, specialGroups } = option
    try {
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
        const updatedCredits = await combineFacultyCredits(
          faculty,
          programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
          allProgrammes.data,
          yearType
        )
        await setCreditStats(updatedCredits, yearType, programmeFilter, specialGroups)
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
    } catch (e) {
      logger.error(`Faculty updates: basic/thesis-writers/credits stats failed with error ${e}`)
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
  try {
    const onlyNew = await findFacultyProgrammeCodes(faculty, 'NEW_STUDY_PROGRAMMES')
    newProgrammes = await setFacultyProgrammes(faculty, onlyNew, 'NEW_STUDY_PROGRAMMES')
  } catch (e) {
    logger.error(`Faculty stats: all programme stats failed with error ${e}`)
  }

  for (const option of options) {
    const { specialGroups, graduated } = option
    try {
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
    } catch (e) {
      logger.error(`Faculty stats: progress stats failed with error ${e}`)
    }
  }
  return 'OK'
}

module.exports = { updateFacultyOverview, updateFacultyProgressOverview }
