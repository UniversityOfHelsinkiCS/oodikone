const router = require('express').Router()
const Population = require('../services/populations')

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

router.post('/populationstatistics', async function (req, res) {
  try {
    const confFromBody = req.body
    if (confFromBody.maxBirthDate) {
      confFromBody.maxBirthDate = confFromBody.maxBirthDate.split('.').join('-')
    }

    if (confFromBody.minBirthDate) {
      confFromBody.minBirthDate = confFromBody.minBirthDate.split('.').join('-')
    }

    confFromBody.courses = confFromBody.courses.map(c => c.code)

    const result = await Population.statisticsOf(confFromBody)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e })
  }
})

router.get('/populationstatistics', async function (req, res) {
  try {
    if (!req.query.year || !req.query.semester || ! req.query.studyRights) {
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
  } catch(e) {
    res.status(400).json({ error: e })
  }
})

router.get('/studyprogrammes', async function (req, res) {
  const programs = [
    {
      id: '500-K004',
      name: 'Bachelor of Science, Mathematics'
    },
    {
      id: '500-K005',
      name: 'Bachelor of Science, Computer Science'
    },
    {
      id: '500-M009',
      name: 'Master of Science (science), Computer Science'
    },
    {
      id: 'ENV1',
      name: 'Bachelor of Science (Biological and Environmental Sciences), Environmental Sciences'
    }
  ]
  res.json(programs)
})

module.exports = router
