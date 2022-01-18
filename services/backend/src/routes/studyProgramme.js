const router = require('express').Router()
const {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
  getGraduationStatsForStudytrack,
} = require('../services/studyprogrammeStats')
const { getStudytrackStatsForStudyprogramme } = require('../services/studytrackStats')
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

  if (code) {
    let data = null
    try {
      data = await getBasicStats(code, yearType)
    } catch (e) {
      logger.error(`Failed to get code ${code} basic stats: ${e}`)
    }
    if (!data) {
      try {
        const result = await getBasicStatsForStudytrack({
          studyprogramme: req.params.id,
          yearType,
        })
        data = await setBasicStats(result, yearType)
      } catch (e) {
        logger.error(`Failed to update code ${code} basic stats: ${e}`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type

  if (code) {
    let data = null
    try {
      data = await getCreditStats(code, yearType)
    } catch (e) {
      logger.error(`Failed to get code ${code} credit stats`)
    }
    if (!data) {
      try {
        const result = await getCreditStatsForStudytrack({
          studyprogramme: req.params.id,
          yearType,
        })
        data = await setCreditStats(result, yearType)
      } catch (e) {
        logger.error(`Failed to update code ${code} credit stats`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/graduationstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type

  if (code) {
    let data = null
    try {
      data = await getGraduationStats(code, yearType)
    } catch (e) {
      logger.error(`Failed to get code ${code} graduation stats`)
    }
    if (!data) {
      try {
        const result = await getGraduationStatsForStudytrack({
          studyprogramme: req.params.id,
          yearType,
        })
        data = await setGraduationStats(result, yearType)
      } catch (e) {
        logger.error(`Failed to update code ${code} graduation stats`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/studytrackstats', async (req, res) => {
  const code = req.params.id

  if (code) {
    let data = null
    try {
      data = await getStudytrackStats(code)
    } catch (e) {
      logger.error(`Failed to get code ${code} studytrack stats: ${e}`)
    }
    if (!data) {
      try {
        const result = await getStudytrackStatsForStudyprogramme({ studyprogramme: req.params.id })
        data = await setStudytrackStats(result)
      } catch (e) {
        logger.error(`Failed to update code ${code} studytrack stats: ${e}`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
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

module.exports = router
