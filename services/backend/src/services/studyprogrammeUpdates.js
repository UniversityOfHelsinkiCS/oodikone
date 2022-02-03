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

const updateBasicView = async code => {
  const yearTypes = ['ACADEMIC_YEAR', 'CALENDAR_YEAR']
  const special = ['SPECIAL_INCLUDED', 'SPECIAL_EXCLUDED']

  yearTypes.forEach(async yearType => {
    special.forEach(async specialGroups => {
      const basicStats = await getBasicStatsForStudytrack({
        studyprogramme: code,
        yearType,
        specialGroups,
      })
      await setBasicStats(basicStats, yearType, specialGroups)

      const creditStats = await getCreditStatsForStudytrack({
        studyprogramme: code,
        yearType,
        specialGroups,
      })
      await setCreditStats(creditStats, yearType, specialGroups)

      const graduationStats = await getGraduationStatsForStudytrack({
        studyprogramme: code,
        yearType,
        specialGroups,
      })
      await setGraduationStats(graduationStats, yearType, specialGroups)
    })
  })

  return 'OK'
}

const updateStudytrackView = async code => {
  const specialIncluded = 'SPECIAL_INCLUDED'
  const specialExcluded = 'SPECIAL_EXCLUDED'
  const graduatedIncluded = 'GRADUATED_INCLUDED'
  const graduatedExcluded = 'GRADUATED_EXCLUDED'

  const statsSpecialAndGraduated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    specialGroups: specialIncluded,
    graduated: graduatedIncluded,
  })
  await setStudytrackStats(statsSpecialAndGraduated, graduatedIncluded, specialIncluded)

  const statsSpecialNotGraduated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    specialGroups: specialIncluded,
    graduated: graduatedExcluded,
  })
  await setStudytrackStats(statsSpecialNotGraduated, graduatedExcluded, specialIncluded)

  const statsNotSpecialAndGraduated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    specialGroups: specialExcluded,
    graduated: graduatedIncluded,
  })
  await setStudytrackStats(statsNotSpecialAndGraduated, graduatedIncluded, specialExcluded)

  const statsNotSpecialNotGraduated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    specialGroups: specialExcluded,
    graduated: graduatedExcluded,
  })
  await setStudytrackStats(statsNotSpecialNotGraduated, graduatedExcluded, specialExcluded)

  return 'OK'
}

module.exports = {
  updateBasicView,
  updateStudytrackView,
}
