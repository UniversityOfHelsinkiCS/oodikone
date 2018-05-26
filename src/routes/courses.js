const router = require('express').Router()
const Course = require('../services/courses')


router.get('/courses', async (req, res) => {
  let results = []
  if (req.query.name) {
    results = await Course.bySearchTerm(req.query.name)
  }

  res.json(results)
})

router.get('/v2/courselist', async (req, res) => {
  let results = []
  if (req.query.code) {
    results = await Course.instancesOf(req.query.code)
  }

  res.json(results)
})

router.get('/v2/courseinstancestatistics', async (req, res) => {
  let results = []
  if (req.query.date && req.query.code && req.query.months) {
    const code = req.query.code
    const date = req.query.date.split('.').join('-')
    const months = req.query.months

    results = await Course.statisticsOf(code, date, months)
  }
  res.json(results)
})

router.get('/courseyearlystats', async (req, res) => {
  let results = []
  if (req.query.start && req.query.code && req.query.end) {
    const { code } = req.query
    const years = { start: req.query.start, end: req.query.end }
    
    results = await Course.yearlyStatsOf(code, years, req.query.separate)
  }
  res.json(results)
})

module.exports = router
