const router = require('express').Router()
const { getAllDegreesAndProgrammes, getAllProgrammes } = require('../services/studyrights')
const MandatoryCourses = require('../services/mandatoryCourses')
const { productivityStatsForStudytrack, throughputStatsForStudytrack } = require('../services/studytrack')
const { findProgrammeTheses, createThesisCourse, deleteThesisCourse } = require('../services/thesis')
const { getProductivity, setProductivity, ping } = require('../services/analyticsService')

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
    const productivityData = await getProductivity(req.params.id)
    res.json(productivityData)
  } else {
    res.status(422)
  }
})

router.get('/v2/studyprogrammes/productivity/recalculate', async (req, res) => {
  const since = req.params.since ? req.params.since : '2017-08-01'
  const code = req.query.code
  res.status(200).end()

  console.log('Productivity stats recalculation starting')
  const codes = code ? [code] : (await getAllProgrammes()).map(p => p.code)
  let ready = 0
  for(const code of codes) {
    try {
      const data = await productivityStatsForStudytrack(code, since)
      await setProductivity(data)
    } catch (e) {
      console.log(`Failed to update productivity stats for code: ${code}, since: ${since}, reason: ${e.message}`)
    }
    ready += 1
    console.log(`Productivity stats recalculation ${ready}/${codes.length} done`)
  }
})

router.get('/v2/studyprogrammes/productivity/ping', async (req, res) => {
  try {
    const result = await ping()
    res.json(result)
  } catch (e) {
    res.status(500)
  }
})

router.get('/v2/studyprogrammes/:id/throughput', async (req, res) => {
  if (req.params.id) {
    const since = req.params.since ? req.params.since : new Date().getFullYear() - 5
    const throughputData = await throughputStatsForStudytrack(req.params.id, since)
    res.json(throughputData)
  } else {
    res.status(422)
  }
})

router.get('/v2/studyprogrammes/:id/thesis', async (req, res) => {
  const { id } = req.params
  if (id) {
    const thesis = await findProgrammeTheses(id)
    res.json(thesis)
  } else {
    res.status(422)
  }
})

router.post('/v2/studyprogrammes/:id/thesis', async (req, res) => {
  const { id } = req.params
  const { course, thesisType } = req.body
  if (id && course && thesisType) {
    const thesis = await createThesisCourse(id, course, thesisType)
    res.status(201).json(thesis)
  } else {
    res.status(422)
  }
})

router.delete('/v2/studyprogrammes/:id/thesis/:course', async (req, res) => {
  const { id, course } = req.params
  if (id && course) {
    const deleted = await deleteThesisCourse(id, course)
    res.status(204).json(deleted)
  } else {
    res.status(422)
  }
})

module.exports = router