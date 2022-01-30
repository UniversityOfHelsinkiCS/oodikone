const {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
  getGraduationStatsForStudytrack,
} = require('../services/studyprogrammeStats')
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

  const studytrackStatsSpecialIncluded = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    specialGroups: specialIncluded,
  })
  await setStudytrackStats(studytrackStatsSpecialIncluded, specialIncluded)

  const studytrackStatsSpecialExcluded = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    specialGroups: specialExcluded,
  })
  await setStudytrackStats(studytrackStatsSpecialExcluded, specialExcluded)

  return 'OK'
}

module.exports = {
  updateBasicView,
  updateStudytrackView,
}
