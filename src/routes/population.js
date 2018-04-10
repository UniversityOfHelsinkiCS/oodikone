const router = require('express').Router()
const Population = require('../services/populations')
const User = require('../services/users')
const Unit = require('../services/units')

router.get('/populationstatistics', async (req, res) => {
  console.log(1)
  try {
    if (!req.query.year || !req.query.semester || !req.query.studyRights) {
      res.status(400).json({ error: 'The query should have a year, semester and study rights defined' })
      return
    }
    console.log(2)

    if (!Array.isArray(req.query.studyRights)) { // studyRights should always be an array
      req.query.studyRights = [req.query.studyRights]
    }
    console.log(3)

    if (!req.decodedToken.admin) {
      console.log(4)
      const accesses = await Promise.all(req.query.studyRights.map(async right => {
        const user = await User.byUsername(req.decodedToken.userId)
        const units = await User.getUnits(user.id)
        return units.some(unit => unit.id === right)
      }))
      console.log(5)

      if (accesses.some(access => !access)) {
        res.status(403).json([]).end()
        return
      }
    }
    req.query.months = 12
    console.log(6)
    const result = await Population.semesterStatisticsFor(req.query)
    console.log(7)
    if (result.error) {
      res.status(400).json(result)
      return
    }
    console.log(8)
    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/studyprogrammes', async (req, res) => {
  try {
    if (!req.decodedToken.admin) {
      const user = await User.byUsername(req.decodedToken.userId)
      const units = await User.getUnits(user.id)
      const arr = units.map(p => ({ id: p.id, name: p.name }))
      res.json(arr).status(200).end()
    } else {
      const units = await Unit.findAllEnabled()
      const arr = units.map(p => ({ id: p.id, name: p.name }))
      res.json(arr).status(200).end()
    }
  } catch (err) {
    res.status(500).json(err).end()
  }
})

module.exports = router
