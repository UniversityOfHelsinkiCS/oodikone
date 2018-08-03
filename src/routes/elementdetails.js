const router = require('express').Router()
const StudyrightService = require('../services/studyrights')

router.get('/studyprogrammes', async (req, res) => {
  try {
    const { admin } = req.decodedToken
    if (!admin) {
      res.status(403).json([])
      return
    } else {
      const studyrights = await StudyrightService.getAllDegreesAndProgrammes()
      res.json(studyrights)
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router