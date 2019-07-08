const router = require('express').Router()
const Population = require('../services/populations')
const Filters = require('../services/filters')
const { updateStudents }  = require('../services/updaterService')
const StudyrightService = require('../services/studyrights')

// POST instead of GET because of too long params and "sensitive" data
router.post('/v2/populationstatistics/courses', async (req, res) => {
  try {
    if (!req.body.startYear || !req.body.semesters || !req.body.studyRights) {
      res.status(400).json({ error: 'The body should have a year, semester and study rights defined' })
      return
    }
    if (!Array.isArray(req.body.studyRights)) { // studyRights should always be an array
      req.body.studyRights = [req.body.studyRights]
    }

    if (req.body.months == null) {
      req.body.months = 12
    }
    const result = await Population.bottlenecksOf(req.body)

    if (result.error) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/v3/populationstatistics', async (req, res) => {
  const { startYear, semesters, studyRights: studyRightsJSON } = req.query
  try {
    if (!startYear || !semesters || !studyRightsJSON) {
      res.status(400).json({ error: 'The query should have a year, semester and studyRights defined' })
      return
    }
    let studyRights = null
    try {
      studyRights = JSON.parse(studyRightsJSON)
      const { roles, rights } = req.decodedToken
      if (!roles || !roles.map(r => r.group_code).includes('admin')) {
        if (!rights.includes(studyRights.programme)) {
          res.status(403).json([])
          return
        }
      }
    } catch (e) {
      console.error(e)
      res.status(400).json({ error: 'The query had invalid studyRights' })
      return
    }

    if (req.query.months == null) {
      req.query.months = 12
    }
    const result = await Population.optimizedStatisticsOf({ ...req.query, studyRights })

    if (result.error) {
      console.log(result.error)
      res.status(400).end()
      return
    }

    console.log(`request completed ${new Date()}`)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.status(400).json({ error: e })
  }
})

router.get('/v2/populationstatistics/filters', async (req, res) => {

  let results = []
  let rights = req.query.studyRights
  if (!Array.isArray(rights)) { // studyRights should always be an array
    rights = [rights]
  }
  try {
    results = await Filters.findForPopulation(rights)
    res.status(200).json(results)

  } catch (err) {
    console.log(err)
    res.status(400).end()
  }

})
router.post('/v2/populationstatistics/filters', async (req, res) => {
  let results = []
  const filter = req.body

  try {
    results = await Filters.createNewFilter(filter)
    res.status(200).json(results)

  } catch (err) {
    console.log(err)
    res.status(400).end()
  }

})
router.delete('/v2/populationstatistics/filters', async (req, res) => {
  let results = []
  const filter = req.body
  try {
    results = await Filters.deleteFilter(filter)
    res.status(200).json(results)

  } catch (err) {
    res.status(400).end()
  }

})

router.post('/updatedatabase', async (req, res) => {
  const studentnumbers = req.body
  console.log(studentnumbers)
  if (studentnumbers) {
    await updateStudents(studentnumbers)
    res.status(200).json('Scheduled')
  } else {
    res.status(400).end()
  }
})

router.get('/v3/populationstatistics/studyprogrammes', async (req, res) => {
  try {
    const { rights, roles } = req.decodedToken
    if (roles && roles.map(r => r.group_code).includes('admin')) {
      const studyrights = await StudyrightService.getAssociations()
      res.json(studyrights)
    } else {
      const studyrights = await StudyrightService.getFilteredAssociations(rights)
      res.json(studyrights)
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v3/populationstatistics/studyprogrammes/unfiltered', async (req, res) => {
  try {
    const studyrights = await StudyrightService.getAssociations()
    res.json(studyrights)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router
