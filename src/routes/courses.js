const router = require('express').Router()
const Course = require('../services/courses')
const moment = require('moment')

const parseUtcDate = date => moment.utc(date).format('YYYY-MM-DD')

router.get('/courses', async (req, res) => {
  let results = []
  if (req.query.name) {
    results = await Course.bySearchTerm(req.query.name)
  }

  res.json(results)
})

router.get('/coursetypes', async (req, res) => {
  const coursetypes = await Course.getAllCourseTypes()
  res.json(coursetypes)
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
    const date = parseUtcDate(req.query.date)
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

router.get('/courses/duplicatecodes', async (req, res) => {
  let results = []
  if (req.query.code) {
    const { code } = req.query
    results = await Course.getDuplicateCodes(code)
  }
  res.json(results)
})

router.get('/courses/duplicatecodes/all', async (req, res) => {
  let results = []
  results = await Course.getAllDuplicates()
  res.json(results)
})

router.post('/courses/duplicatecodes/:code/:code2', async (req, res) => {
  let results = []
  if (req.params.code && req.params.code2) {
    const { code, code2 } = req.params
    results = await Course.setDuplicateCode(code, code2)
    res.status(200).json(results)
  }
  res.status(400).end()
})

router.delete('/courses/duplicatecodes/:code/:code2', async (req, res) => {
  let results = []
  if (req.params.code && req.params.code2) {
    const { code, code2 } = req.params
    results = await Course.removeDuplicateCode(code, code2)
    res.status(200).json(results)
  }
  res.status(400).end()
})

module.exports = router
