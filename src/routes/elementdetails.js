const router = require('express').Router()
const { getAllDegreesAndProgrammes } = require('../services/studyrights')
const MandatoryCourses = require('../services/mandatoryCourses')
const { productivityStatsForStudytrack } = require('../services/studytrack')

router.get('/studyprogrammes', async (req, res) => {
  try {
    const studyrights = await getAllDegreesAndProgrammes()
    res.json(studyrights)
  } catch (err) {
    res.status(500).json(err)
  }
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

router.get('/v2/studyprogrammes/:id/productivity', async (req, res) => {
  if (req.params.id) {
    const productivityData = await productivityStatsForStudytrack(req.params.id)
    res.json(productivityData)
  } else {
    res.status(422)
  }
})


module.exports = router