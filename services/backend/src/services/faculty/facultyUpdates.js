const logger = require('../../util/logger')
const { findFacultyProgrammeCodes } = require('./faculty')
const { combineFacultyBasics } = require('./facultyBasics')
const { combineFacultyCredits } = require('./facultyCredits')
const { setFacultyProgrammes, setBasicStats, setCreditStats } = require('./facultyService')

const updateFacultyOverview = async faculty => {
  const calendarNew = {
    yearType: 'CALENDAR_YEAR',
    programmeFilter: 'NEW_STUDY_PROGRAMMES',
  }

  const calendarAll = {
    yearType: 'CALENDAR_YEAR',
    programmeFilter: 'ALL_PROGRAMMES',
  }

  const academicNew = {
    yearType: 'ACADEMIC_YEAR',
    programmeFilter: 'NEW_STUDY_PROGRAMMES',
  }

  const academicAll = {
    yearType: 'ACADEMIC_YEAR',
    programmeFilter: 'ALL_PROGRAMMES',
  }

  const options = [calendarNew, calendarAll, academicNew, academicAll]
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
    const { yearType, programmeFilter } = option
    try {
      const updatedStudentInfo = await combineFacultyBasics(
        faculty,
        programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
        yearType,
        allProgrammeCodes,
        programmeFilter
      )
      await setBasicStats(updatedStudentInfo, option.yearType, option.programmeFilter)

      const updatedCredits = await combineFacultyCredits(
        faculty,
        programmeFilter === 'ALL_PROGRAMMES' ? allProgrammes.data : newProgrammes.data,
        yearType,
        'SPECIAL_INCLUDED'
      )
      await setCreditStats(updatedCredits, yearType, programmeFilter)
    } catch (e) {
      logger.error(e)
    }
  }
  return 'OK'
}

module.exports = { updateFacultyOverview }
