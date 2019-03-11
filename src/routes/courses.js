const router = require('express').Router()
const Course = require('../services/courses')
const logger = require('../util/logger')

router.get('/courses', async (req, res) => {
  let results = []
  if (req.query.name) {
    results = await Course.bySearchTerm(req.query.name, req.query.language)
  }

  res.json(results)
})

router.get('/coursesmulti', async (req, res) => {
  let results = []
  if (req.query.name || req.query.discipline || req.query.type) {
    results = await Course.bySearchTermTypeAndDiscipline(req.query.name, req.query.type, req.query.discipline, req.query.language) // eslint-disable-line
  }
  res.json(results)
})

router.get('/v2/coursesmulti', async (req, res) => {
  let results = []
  if (req.query.name || req.query.code) {
    results = await Course.byNameAndOrCodeLike(req.query.name, req.query.code)
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
  res.status(410).send('Deprecated')
})

router.get('/v2/courseyearlystats', async (req, res) => {
  let results = []
  const { rights } = req.decodedToken
  if (rights.length <= 0) {
    return res.status(403).json({ error: 'No programmes so no access to course stats' })
  }
  if (req.query.start && req.query.codes && req.query.end) {
    const { codes } = req.query
    const years = { start: req.query.start, end: req.query.end }
    results = await Promise.all(JSON.parse(codes)
      .map(code => Course.yearlyStatsOf(code, years, req.query.separate, req.query.language)))
  }
  res.json(results)
})

router.get('/v3/courseyearlystats', async (req, res) => {
  try {
    const { rights } = req.decodedToken
    if (rights.length <= 0) {
      return res.status(403).json({ error: 'No programmes so no access to course stats' })
    }
    const { codes, startyearcode, endyearcode, separate: sep } = req.query
    const separate = !sep ? false : JSON.parse(sep)
    if (!codes || !startyearcode) {
      res.status(422).send('Missing required query parameters')
    } else {
      const results = await Course.courseYearlyStats(codes, separate, startyearcode, endyearcode)
      res.json(results)
    }
  } catch (e) {
    logger.error(e.message)
    console.log(e)
    res.status(500).send('Something went wrong with handling the request.')
  }
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
