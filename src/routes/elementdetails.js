const router = require('express').Router()
const { getAllDegreesAndProgrammes, getAssociations } = require('../services/studyrights')
const { getMandatoryCourses } = require('../services/courses')

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

router.get('/v2/studyprogrammes/:id/mandatory_courses', async (req, res) => {
  console.log(req.params)
  if (req.params.id) {
    const codes = await getMandatoryCourses(req.params.id)
    res.json(codes)
  } else {
    res.status(422)
  }
})


module.exports = router