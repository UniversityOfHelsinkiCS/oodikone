const router = require('express').Router()
const Course = require('../services/courses')

router.get('/courses', async (req, res) => {
  let results = []
  if (req.query.name) {
    results = await Course.bySearchTerm(req.query.name, req.query.language)
  }

  res.json(results)
})

router.get('/coursetypes', async (req, res) => {
  const coursetypes = await Course.getAllCourseTypes()
  res.json(coursetypes)
})

router.get('/coursedisciplines', async (req, res) => {
  const courseDisciplines = await Course.getAllDisciplines()
  res.json(courseDisciplines)
})

router.get('/v2/courselist', async (req, res) => {
  res.status(410).send('Deprecated')
})

router.get('/v2/courseinstancestatistics', async (req, res) => {
  res.status(410).send('Deprecated')}
)

router.get('/courseyearlystats', async (req, res) => {
  let results = []
  if (req.query.start && req.query.code && req.query.end) {
    const { code } = req.query
    const years = { start: req.query.start, end: req.query.end }
    
    results = await Course.yearlyStatsOf(code, years, req.query.separate, req.query.language)
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
