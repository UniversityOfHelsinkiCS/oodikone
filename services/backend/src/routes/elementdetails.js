const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')
const { optionData } = require('../services/studyprogramme')
const { findProgrammeTheses, createThesisCourse, deleteThesisCourse } = require('../services/thesis')
const { getAllProgrammes, getAllElementDetails } = require('../services/studyrights')

router.get('/elementdetails/all', async (req, res) => {
  const elementdetails = await getAllElementDetails()
  res.json(elementdetails)
})

router.get('/studyprogrammes', async (req, res) => {
  const studyrights = await getAllProgrammes()
  res.json(studyrights)
})

router.get('/v2/studyprogrammes/:id/optiondata', async (req, res) => {
  const code = req.params.id

  let level
  if (code.includes('MH')) {
    level = 'MSC'
  } else if (code.includes('KH')) {
    level = 'BSC'
  } else {
    return res.json([])
  }

  const data = await optionData(new Date('2017-07-31'), new Date(), code, level)
  res.json(data)
})

router.get('/v2/studyprogrammes/:id/mandatory_courses', async (req, res) => {
  if (req.params.id) {
    const codes = await MandatoryCourses.byStudyprogramme(req.params.id)
    res.json(codes)
  } else {
    res.status(422).end()
  }
})

router.get('/v2/studyprogrammes/:id/thesis', async (req, res) => {
  const { id } = req.params
  if (id) {
    const thesis = await findProgrammeTheses(id)
    res.json(thesis)
  } else {
    res.status(422).end()
  }
})

router.post('/v2/studyprogrammes/:id/thesis', async (req, res) => {
  const { id } = req.params
  const { course, thesisType } = req.body
  if (id && course && thesisType) {
    const thesis = await createThesisCourse(id, course, thesisType)
    res.status(201).json(thesis)
  } else {
    res.status(422).end()
  }
})

router.delete('/v2/studyprogrammes/:id/thesis/:course', async (req, res) => {
  const { id, course } = req.params
  if (id && course) {
    const deleted = await deleteThesisCourse(id, course)
    res.status(204).json(deleted)
  } else {
    res.status(422).end()
  }
})

module.exports = router
