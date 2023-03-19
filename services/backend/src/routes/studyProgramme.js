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
const logger = require('../util/logger')

router.get('/v2/studyprogrammes/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()

  const data = await getBasicStats(code, yearType, specialGroups)
  if (data) return res.json(data)

  const updated = await getBasicStatsForStudytrack({
    studyprogramme: req.params.id,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (updated) await setBasicStats(updated, yearType, specialGroups)
  return res.json(updated)
})

router.get('/v2/studyprogrammes/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()

  const data = await getCreditStats(code, yearType, specialGroups)
  if (data) return res.json(data)
  const updatedStats = await getCreditStatsForStudytrack({
    studyprogramme: req.params.id,
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

  if (!code) return res.status(422).end()

  const data = await getGraduationStats(code, yearType, specialGroups)
  if (data) return res.json(data)
  const updatedStats = await getGraduationStatsForStudytrack({
    studyprogramme: req.params.id,
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
  const date = new Date()
  date.setHours(23, 59, 59, 999)

  try {
    const data = await getStudyprogrammeCoursesForStudytrack(date.getTime(), code, showByYear)
    return res.json(data)
  } catch (e) {
    logger.error(`Failed to get code ${code} programme courses stats: ${e}`)
  }
})

router.get('/v2/studyprogrammes/:id/studytrackstats', async (req, res) => {
  const code = req.params.id
  const graduated = req.query?.graduated
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()

  const data = await getStudytrackStats(code, graduated, specialGroups)
  if (data) return res.json(data)

  const updated = await getStudytrackStatsForStudyprogramme({
    studyprogramme: code,
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
  if (code) {
    let result = null
    try {
      result = await updateBasicView(code)
    } catch (e) {
      logger.error(`Failed to update code ${code} basic stats: ${e}`)
    }
    return res.json(result)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/update_studytrackview', async (req, res) => {
  const code = req.params.id
  if (code) {
    let result = null
    try {
      result = await updateStudytrackView(code)
    } catch (e) {
      logger.error(`Failed to update code ${code} studytrack stats: ${e}`)
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

  let gradData = await getGraduationStats(code, yearType, specialGroups)
  if (!gradData) {
    const updatedStats = await getGraduationStatsForStudytrack({
      studyprogramme: req.params.id,
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

  let progressData = await getStudytrackStats(code, graduated, specialGroups)
  if (!progressData) {
    const updated = await getStudytrackStatsForStudyprogramme({
      studyprogramme: code,
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

  delete gradData.tableStats
  delete gradData.graphStats
  delete gradData.titles

  const data = {
    id: code,
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
