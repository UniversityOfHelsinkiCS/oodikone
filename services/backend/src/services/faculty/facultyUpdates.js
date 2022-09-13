const logger = require('../../util/logger')
const { findFacultyProgrammeCodes } = require('./faculty')
const { combineFacultyBasics } = require('./facultyBasics')
const { combineFacultyCredits } = require('./facultyCredits')
const { combineFacultyThesisWriters } = require('./facultyThesisWriters')
const { setFacultyProgrammes, setBasicStats, setCreditStats, setThesisWritersStats } = require('./facultyService')

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
    logger.error(e)
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
      if (statsType === 'ALL' || statsType === 'CREDITS') {
        const updatedCredits = await combineFacultyCredits(
          faculty,
          programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
          yearType,
          specialGroups
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
      logger.error(e)
    }
  }
  return 'OK'
}

module.exports = { updateFacultyOverview }
