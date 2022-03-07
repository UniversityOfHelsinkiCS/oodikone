const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')
const { getAllProgrammes, getAllElementDetails } = require('../services/studyrights')

router.get('/elementdetails/all', async (req, res) => {
  const elementdetails = await getAllElementDetails()
  res.json(elementdetails)
})

router.get('/studyprogrammes', async (req, res) => {
  const studyrights = await getAllProgrammes()
  res.json(studyrights)
})

router.get('/v2/studyprogrammes/:id/mandatory_courses', async (req, res) => {
  if (req.params.id) {
    const codes = await MandatoryCourses.byStudyprogramme(req.params.id)
    res.json(codes)
  } else {
    res.status(422).end()
  }
})

module.exports = router
