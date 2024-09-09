const { setBasicStats, setCreditStats, setGraduationStats, setStudytrackStats } = require('../analyticsService')
const { computeCreditsProduced } = require('../providerCredits')
const { getBasicStatsForStudytrack } = require('./studyProgrammeBasics')
const { getGraduationStatsForStudytrack } = require('./studyProgrammeGraduations')
const { getStudyRightsInProgramme } = require('./studyRightFinders')
const { getStudytrackStatsForStudyprogramme } = require('./studyTrackStats')

const updateBasicView = async (code, combinedProgramme) => {
  const yearOptions = ['CALENDAR_YEAR', 'ACADEMIC_YEAR']
  const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED']

  for (const yearType of yearOptions) {
    for (const specialGroup of specialGroupOptions) {
      const isAcademicYear = yearType === 'ACADEMIC_YEAR'
      const includeAllSpecials = specialGroup === 'SPECIAL_INCLUDED'

      const basicStats = await getBasicStatsForStudytrack({
        studyprogramme: code,
        combinedProgramme,
        settings: { isAcademicYear, includeAllSpecials },
      })
      await setBasicStats(basicStats, yearType, specialGroup)

      const creditStats = await computeCreditsProduced(code, isAcademicYear, includeAllSpecials)
      await setCreditStats(creditStats, isAcademicYear, includeAllSpecials)

      const graduationStats = await getGraduationStatsForStudytrack({
        studyprogramme: code,
        combinedProgramme,
        settings: { isAcademicYear, includeAllSpecials },
      })
      await setGraduationStats(graduationStats, yearType, specialGroup)
    }
  }

  return 'OK'
}

const updateStudytrackView = async (code, combinedProgramme) => {
  const graduatedOptions = ['GRADUATED_INCLUDED', 'GRADUATED_EXCLUDED']
  const specialGroupOptions = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED']
  const studyRightsOfProgramme = await getStudyRightsInProgramme(code, false, true)

  for (const graduated of graduatedOptions) {
    for (const specialGroup of specialGroupOptions) {
      const stats = await getStudytrackStatsForStudyprogramme({
        studyprogramme: code,
        combinedProgramme,
        settings: {
          specialGroups: specialGroup === 'SPECIAL_INCLUDED',
          graduated: graduated === 'GRADUATED_INCLUDED',
        },
        studyRightsOfProgramme,
      })
      await setStudytrackStats(stats, graduated, specialGroup)
    }
  }

  return 'OK'
}

module.exports = {
  updateBasicView,
  updateStudytrackView,
}
