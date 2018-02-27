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

module.exports = router
