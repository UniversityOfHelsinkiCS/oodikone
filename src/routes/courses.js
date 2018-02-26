const router = require('express').Router()
const Course = require('../services/courses')


router.get('/courses', async function (req, res) {
  let results = []
  if (req.query.name) {
    results = await Course.bySearchTerm(req.query.name)
  }

  res.json(results)
})

router.post('/courselist', async function (req, res) {
  const results = await Course.instancesOf(req.body.code)

  res.json(results)
})

router.get('/v2/courselist', async function (req, res) {
  let results = []
  if (req.query.code) {
    results = await Course.instancesOf(req.query.code)
  }

  res.json(results)
})

router.post('/coursestatistics', async function (req, res) {
  const code = req.body.code
  const date = req.body.date.split('.').join('-')
  const months = req.body.subsequentMonthsToInvestigate

  const results = await Course.statisticsOf(code, date, months)
  res.json(results)
})

router.get('/v2/coursestatistics', async function (req, res) {
  let results = []
  if (req.query.date && req.query.code && req.query.months) {
    const code = req.query.code
    const date = req.query.date.split('.').join('-')
    const months = req.query.months

    results = await Course.statisticsOf(code, date, months)
  }
  res.json(results)
})

module.exports = router
