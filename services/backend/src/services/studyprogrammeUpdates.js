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
  const academic = 'ACADEMIC_YEAR'
  const calendar = 'CALENDAR_YEAR'

  const basicStatsAcademic = await getBasicStatsForStudytrack({
    studyprogramme: code,
    yearType: academic,
  })
  await setBasicStats(basicStatsAcademic, academic)

  const basicStatsCalendar = await getBasicStatsForStudytrack({
    studyprogramme: code,
    yearType: calendar,
  })
  await setBasicStats(basicStatsCalendar, calendar)

  const creditStatsAcademic = await getCreditStatsForStudytrack({
    studyprogramme: code,
    yearType: academic,
  })
  await setCreditStats(creditStatsAcademic, academic)

  const creditStatsCalendar = await getCreditStatsForStudytrack({
    studyprogramme: code,
    yearType: calendar,
  })
  await setCreditStats(creditStatsCalendar, calendar)

  const graduationStatsAcademic = await getGraduationStatsForStudytrack({
    studyprogramme: code,
    yearType: academic,
  })
  await setGraduationStats(graduationStatsAcademic, academic)

  const graduationStatsCalendar = await getGraduationStatsForStudytrack({
    studyprogramme: code,
    yearType: calendar,
  })
  await setGraduationStats(graduationStatsCalendar, calendar)

  return 'OK'
}

const updateStudytrackView = async code => {
  const result = await getStudytrackStatsForStudyprogramme({ studyprogramme: code })
  await setStudytrackStats(result)
  return 'OK'
}

module.exports = {
  updateBasicView,
  updateStudytrackView,
}
