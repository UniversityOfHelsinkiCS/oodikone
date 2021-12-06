const router = require('express').Router()
const {
  getBasicStatsForStudytrack,
  getCreditStatsForStudytrack,
  getGraduationStatsForStudytrack,
} = require('../services/newStudyprogramme')
const {
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getGraduationStats,
  setGraduationStats,
} = require('../services/analyticsService')
const logger = require('../util/logger')

router.get('/v2/studyprogrammes/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type

  if (code) {
    let data = null
    try {
      data = await getBasicStats(code, yearType)
    } catch (e) {
      logger.error(`Failed to get code ${code} basic stats`)
    }
    if (!data) {
      try {
        let result = await getBasicStatsForStudytrack({
          studyprogramme: req.params.id,
          yearType,
        })
        data = await setBasicStats(result, yearType)
      } catch (e) {
        logger.error(`Failed to update code ${code} basic stats`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/creditstats', async (req, res) => {
  const code = req.params.id
  if (code) {
    let data = null
    try {
      data = await getCreditStats(code)
    } catch (e) {
      logger.error(`Failed to get code ${code} credit stats`)
    }
    if (!data) {
      try {
        let result
        if (code.includes('MH') || code.includes('KH')) {
          result = await getCreditStatsForStudytrack({
            studyprogramme: req.params.id,
            startDate: new Date('2017-01-01'),
          })
        } else {
          result = await getCreditStatsForStudytrack({
            studyprogramme: req.params.id,
            startDate: new Date('2000-01-01'),
          })
        }
        data = await setCreditStats(result)
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
  if (code) {
    let data = null
    try {
      data = await getGraduationStats(code)
    } catch (e) {
      logger.error(`Failed to get code ${code} graduation stats`)
    }
    if (!data) {
      try {
        let result
        if (code.includes('MH') || code.includes('KH')) {
          result = await getGraduationStatsForStudytrack({
            studyprogramme: req.params.id,
            startDate: new Date('2017-01-01'),
          })
        } else {
          result = await getGraduationStatsForStudytrack({
            studyprogramme: req.params.id,
            startDate: new Date('2000-01-01'),
          })
        }
        data = await setGraduationStats(result)
      } catch (e) {
        logger.error(`Failed to update code ${code} graduation stats`)
      }
    }
    return res.json(data)
  } else {
    res.status(422).end()
  }
})

router.use('*', (req, res, next) => next())

module.exports = router
