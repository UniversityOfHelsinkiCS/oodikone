const router = require('express').Router()
const StudyrightService = require('../services/studyrights')

router.get('/studyprogrammes', async (req, res) => {
  try {
    const { admin, czar } = req.decodedToken
    if (!(admin || czar)) {
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