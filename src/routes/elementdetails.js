const router = require('express').Router()
const { getAllDegreesAndProgrammes, getAssociations } = require('../services/studyrights')

router.get('/studyprogrammes', async (req, res) => {
  try {
    const { admin, czar } = req.decodedToken
    if (!(admin || czar)) {
      res.status(403).json([])
      return
    } else {
      const studyrights = await getAllDegreesAndProgrammes()
      res.json(studyrights)
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v2/studyprogrammes', async (req, res) => {
  const { admin } = req.decodedToken
  if (!admin) {
    res.status(401).send('No admin rights')
  } else {
    const associations = await getAssociations()
    res.json(associations)
  }
})


module.exports = router