const router = require('express').Router()
const Population = require('../services/populations')
const User = require('../services/users')
const Unit = require('../services/units')

router.get('/v2/populationstatistics/courses', async (req, res) => {
  try {
    if (!req.query.year || !req.query.semester || !req.query.studyRights) {
      res.status(400).json({ error: 'The query should have a year, semester and study rights defined' })
      return
    }
    if (!Array.isArray(req.query.studyRights)) { // studyRights should always be an array
      req.query.studyRights = [req.query.studyRights]
    }

    if (req.query.months == null) {
      req.query.months = 12
    }

    const result = await Population.bottlenecksOf(req.query)
    console.log("result: ", result)
    if (result.error) {
      res.status(400).json(result)
      return
    }

    res.json(result)
  } catch (e) {
    res.status(400).json({ error: e })
  }
})


router.get('/v2/populationstatistics', async (req, res) => {
  try {
    if (!req.query.year || !req.query.semester || !req.query.studyRights) {
      res.status(400).json({ error: 'The query should have a year, semester and study rights defined' })
      return
    }

    if (!Array.isArray(req.query.studyRights)) { // studyRights should always be an array
      req.query.studyRights = [req.query.studyRights]
    }

    if (!req.decodedToken.admin) {
      const accesses = await Promise.all(req.query.studyRights.map(async right => {
        const user = await User.byUsername(req.decodedToken.userId)
        const units = await User.getUnits(user.id)
        return units.some(unit => unit.id === right)
      }))

      if (accesses.some(access => !access)) {
        res.status(403).json([])
        return
      }
    }

    if (req.query.months==null) {
      req.query.months = 12
    }
    
    const result = await Population.optimizedStatisticsOf(req.query)
    if (result.error) {
      res.status(400).json(result)
      return
    }

    console.log(`request completed ${new Date()}`)
    res.json(result)    
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/studyprogrammes', async (req, res) => {
  try {
    // if (!req.decodedToken.admin) {
    //   const user = await User.byUsername(req.decodedToken.userId)
    //   const units = await User.getUnits(user.id)
    //   const arr = units.map(p => ({ id: p.id, name: p.name }))
    //   res.json(arr)
    // } else {
    //   const units = await Unit.findAllEnabled()
    //   const arr = units.map(p => ({ id: p.id, name: p.name }))
    //   res.json(arr)
    // }
    const units = await Unit.getUnitsFromElementDetails()
    res.json(units)
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router
