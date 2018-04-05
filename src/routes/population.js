const router = require('express').Router()
const Population = require('../services/populations')
const Unit = require('../services/units')

router.get('/studyrightkeywords', async function (req, res) {
  let results = []
  if (req.query.search) {
    results = await Population.studyrightsByKeyword(req.query.search)
  }

  res.json(results)
})

router.get('/enrollmentdates', async function (req, res) {
  const results = await Population.universityEnrolmentDates()
  res.json(results)
})

router.get('/populationstatistics', async function (req, res) {
  try {
    if (!req.query.year || !req.query.semester || !req.query.studyRights) {
      res.status(400).json({ error: 'The query should have a year, semester and study rights defined' })
      return
    }
    if (!Array.isArray(req.query.studyRights)) { // studyRights should always be an array
      req.query.studyRights = [req.query.studyRights]
    }
    req.query.months = 12
    const result = await Population.semesterStatisticsFor(req.query)
    if (result.error) {
      res.status(400).json(result)
      return
    }
    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/studyprogrammes', async function (req, res) {
  const programs = await Unit.findAllEnabled()
  const arr = programs.map(p => { return { id: p.id, name: p.name }})
  res.json(arr)
})

module.exports = router
