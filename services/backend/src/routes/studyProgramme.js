const router = require('express').Router()
const { getBasicStatsForStudytrack } = require('../services/studyprogrammeBasics')
const { getCreditStatsForStudytrack } = require('../services/studyprogrammeCredits')
const { getGraduationStatsForStudytrack } = require('../services/studyprogrammeGraduations')
const { getStudytrackStatsForStudyprogramme } = require('../services/studytrackStats')
const { getStudyprogrammeCoursesForStudytrack } = require('../services/studyprogrammeCourses')
const {
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getGraduationStats,
  setGraduationStats,
  getStudytrackStats,
  setStudytrackStats,
} = require('../services/analyticsService')
const { updateBasicView, updateStudytrackView } = require('../services/studyprogrammeUpdates')
const { getProgrammeName } = require('../services/studyprogramme')
const logger = require('../util/logger')

router.get('/v2/studyprogrammes/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme
  if (!code) return res.status(422).end()

  const data = await getBasicStats(code, combinedProgramme, yearType, specialGroups)
  if (data) return res.json(data)

  const updated = await getBasicStatsForStudytrack({
    studyprogramme: req.params.id,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updated) await setBasicStats(updated, combinedProgramme, yearType, specialGroups)
  return res.json(updated)
})

router.get('/v2/studyprogrammes/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme

  if (!code) return res.status(422).end()

  const data = await getCreditStats(code, combinedProgramme, yearType, specialGroups)
  if (data) return res.json(data)
  const updatedStats = await getCreditStatsForStudytrack({
    studyprogramme: req.params.id,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updatedStats) await setCreditStats(updatedStats, yearType, specialGroups)
  return res.json(updatedStats)
})

router.get('/v2/studyprogrammes/:id/graduationstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme

  if (!code) return res.status(422).end()

  const data = await getGraduationStats(code, combinedProgramme, yearType, specialGroups)
  if (data) return res.json(data)
  const updatedStats = await getGraduationStatsForStudytrack({
    studyprogramme: req.params.id,
    combinedProgramme,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updatedStats) await setGraduationStats(updatedStats, yearType, specialGroups)
  return res.json(updatedStats)
})

router.get('/v2/studyprogrammes/:id/coursestats', async (req, res) => {
  const code = req.params.id
  const showByYear = req.query.academicyear
  const combinedProgramme = req.query?.combined_programme
  const date = new Date()
  date.setHours(23, 59, 59, 999)

  try {
    const data = await getStudyprogrammeCoursesForStudytrack(date.getTime(), code, showByYear, combinedProgramme)
    return res.json(data)
  } catch (e) {
    logger.error(`Failed to get code ${code} programme courses stats: ${e}`)
  }
})

router.get('/v2/studyprogrammes/:id/studytrackstats', async (req, res) => {
  const code = req.params.id
  const graduated = req.query?.graduated
  const specialGroups = req.query?.special_groups
  const combinedProgramme = req.query?.combined_programme

  if (!code) return res.status(422).end()

  const data = await getStudytrackStats(code, combinedProgramme, graduated, specialGroups)
  if (data) return res.json(data)

  const updated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
    combinedProgramme,
    settings: {
      graduated: graduated === 'GRADUATED_INCLUDED',
      specialGroups: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updated) await setStudytrackStats(updated, graduated, specialGroups)
  return res.json(updated)
})

router.get('/v2/studyprogrammes/:id/update_basicview', async (req, res) => {
  const code = req.params.id
  const combinedProgramme = req.query?.combined_programme
  if (code) {
    let result = null
    try {
      result = await updateBasicView(code, combinedProgramme)
    } catch (e) {
      logger.error(`Failed to update code ${code} - ${combinedProgramme || 'not combined'} basic stats: ${e}`)
    }
    return res.json(result)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/update_studytrackview', async (req, res) => {
  const code = req.params.id
  const combinedProgramme = req.query?.combined_programme
  if (code) {
    let result = null
    try {
      result = await updateStudytrackView(code, combinedProgramme)
    } catch (e) {
      logger.error(`Failed to update code ${code} - ${combinedProgramme || 'not combined'} studytrack stats: ${e}`)
    }
    return res.json(result)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/evaluationstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const graduated = req.query?.graduated

  if (!code) return res.status(422).end()

  // Statistics for Tilannekuvalomake view
  const combinedProgramme = ''
  let gradData = await getGraduationStats(code, combinedProgramme, yearType, specialGroups)
  if (!gradData) {
    const updatedStats = await getGraduationStatsForStudytrack({
      studyprogramme: req.params.id,
      combinedProgramme,
      settings: {
        isAcademicYear: yearType === 'ACADEMIC_YEAR',
        includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
      },
    })
    if (updatedStats) {
      await setGraduationStats(updatedStats, yearType, specialGroups)
      gradData = updatedStats
    }
  }

  let progressData = await getStudytrackStats(code, combinedProgramme, graduated, specialGroups)
  if (!progressData) {
    const updated = await getStudytrackStatsForStudyprogramme({
      studyprogramme: code,
      combinedProgramme,
      settings: {
        graduated: graduated === 'GRADUATED_INCLUDED',
        specialGroups: specialGroups === 'SPECIAL_INCLUDED',
      },
    })
    if (updated) {
      await setStudytrackStats(updated, graduated, specialGroups)
      progressData = updated
    }
  }

  const programmeName = await getProgrammeName(code)

  delete gradData.tableStats
  delete gradData.graphStats
  delete gradData.titles
  const data = {
    id: code,
    programmeName: programmeName?.name,
    status: gradData?.status,
    lastUpdated: gradData.lastUpdated,
    graduations: gradData,
    progress: {
      creditTableStats: {},
      creditTableTitles: progressData?.creditTableTitles,
      graphData: {
        creditGraphStats: {},
        id: progressData?.id,
        years: progressData?.years,
      },
    },
  }

  data.progress.creditTableStats[code] = progressData?.creditTableStats[code]
  data.progress.graphData.creditGraphStats[code] = progressData?.creditGraphStats[code]

  return res.json(data)
})

module.exports = router
