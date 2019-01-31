const router = require('express').Router()
const { getAllDegreesAndProgrammes, getAssociations } = require('../services/studyrights')
const MandatoryCourses = require('../services/mandatoryCourses')

router.get('/studyprogrammes', async (req, res) => {
  try {
    const studyrights = await getAllDegreesAndProgrammes()
    res.json(studyrights)
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/v2/studyprogrammes', async (req, res) => {
  const associations = await getAssociations()
  res.json(associations)
})

router.get('/v2/studyprogrammes/:id/mandatory_courses', async (req, res) => {
  console.log(req.params)
  if (req.params.id) {
    const codes = await MandatoryCourses.byStudyprogramme(req.params.id)
    res.json(codes)
  } else {
    res.status(422)
  }
})


module.exports = router