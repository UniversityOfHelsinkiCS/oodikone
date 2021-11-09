const router = require('express').Router()
const { getBasicStatsForStudyTrack } = require('../services/studyprogramme')
const { getBasicStats, setBasicStats } = require('../services/analyticsService')
const logger = require('../util/logger')

router.get('/v2/studyprogrammes/:id/basicstats', async (req, res) => {
  const code = req.params.id
  if (code) {
    let data = null
    try {
      data = await getBasicStats(code)
    } catch (e) {
      logger.error(`Failed to get code ${code} basic stats`)
    }
    if (!data) {
      try {
        let result
        if (code.includes('MH') || code.includes('KH')) {
          result = await getBasicStatsForStudyTrack({
            studyprogramme: req.params.id,
            startDate: new Date('2017-01-01'),
          })
        } else {
          result = await getBasicStatsForStudyTrack({
            studyprogramme: req.params.id,
            startDate: new Date('2000-01-01'),
          })
        }
        data = await setBasicStats(result)
      } catch (e) {
        logger.error(`Failed to update code ${code} basic stats`)
      }
    }
    return res.json({ data })
  } else {
    res.status(422).end()
  }
})

router.use('*', (req, res, next) => next())

module.exports = router
