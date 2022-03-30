const { getBasicStatsForStudytrack } = require('../services/studyprogrammeBasics')
const { getCreditStatsForStudytrack } = require('../services/studyprogrammeCredits')
const { getGraduationStatsForStudytrack } = require('../services/studyprogrammeGraduations')
const { getStudytrackStatsForStudyprogramme } = require('../services/studytrackStats')
const {
  setBasicStats,
  setCreditStats,
  setGraduationStats,
  setStudytrackStats,
} = require('../services/analyticsService')
const logger = require('../util/logger')

const updateBasicView = async code => {
  const specialCalendar = {
    yearType: 'CALENDAR_YEAR',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialAcademic = {
    yearType: 'ACADEMIC_YEAR',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialExcludedCalendar = {
    yearType: 'CALENDAR_YEAR',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const specialExcludedAcademic = {
    yearType: 'ACADEMIC_YEAR',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const options = [specialCalendar, specialAcademic, specialExcludedCalendar, specialExcludedAcademic]

  for (const option of options) {
    try {
      const basicStats = await getBasicStatsForStudytrack({
        studyprogramme: code,
        settings: {
          isAcademicYear: option.yearType === 'ACADEMIC_YEAR',
          includeAllSpecials: option.specialGroups === 'SPECIAL_INCLUDED',
        },
      })
      await setBasicStats(basicStats, option.yearType, option.specialGroups)

      const creditStats = await getCreditStatsForStudytrack({
        studyprogramme: code,
        settings: {
          isAcademicYear: option.yearType === 'ACADEMIC_YEAR',
          includeAllSpecials: option.specialGroups === 'SPECIAL_INCLUDED',
        },
      })
      await setCreditStats(creditStats, option.yearType, option.specialGroups)

      const graduationStats = await getGraduationStatsForStudytrack({
        studyprogramme: code,
        settings: {
          isAcademicYear: option.yearType === 'ACADEMIC_YEAR',
          includeAllSpecials: option.specialGroups === 'SPECIAL_INCLUDED',
        },
      })
      await setGraduationStats(graduationStats, option.yearType, option.specialGroups)
    } catch (e) {
      logger.error(e)
    }
    return 'OK'
  }
}

const updateStudytrackView = async code => {
  const specialGraduated = {
    graduated: 'GRADUATED_INCLUDED',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialExcludedGraduated = {
    graduated: 'GRADUATED_INCLUDED',
    specialGroups: 'SPECIAL_EXCLUDED',
  }
  const specialGraduatedExcluded = {
    graduated: 'GRADUATED_EXCLUDED',
    specialGroups: 'SPECIAL_INCLUDED',
  }
  const specialExcludedGraduatedExcluded = {
    graduated: 'GRADUATED_EXCLUDED',
    specialGroups: 'SPECIAL_EXCLUDED',
  }

  const options = [
    specialGraduated,
    specialExcludedGraduated,
    specialGraduatedExcluded,
    specialExcludedGraduatedExcluded,
  ]

  for (const option of options) {
    try {
      const stats = await getStudytrackStatsForStudyprogramme({
        studyprogramme: code,
        settings: {
          specialGroups: option.specialGroups === 'SPECIAL_INCLUDED',
          graduated: option.graduated === 'GRADUATED_INCLUDED',
        },
      })
      await setStudytrackStats(stats, option.graduated, option.specialGroups)
    } catch (e) {
      logger.error(e)
    }
  }

  return 'OK'
}

module.exports = {
  updateBasicView,
  updateStudytrackView,
}
