const router = require('express').Router()
const teachers = require('../services/teachers')

router.get('/teachers', async (req, res) => {
  const { searchTerm } = req.query
  const result = await teachers.bySearchTerm(searchTerm)
  res.json(result)
})

router.get('/teachers/stats', async (req, res) => {
  const { providers, startYearCode, endYearCode } = req.query
  if (!providers || !startYearCode) {
    return res.status(422).send('Missing required query parameters.')
  }
  const result = await teachers.yearlyStatistics(providers, startYearCode, endYearCode||startYearCode + 1)
  res.json(result)
})

router.get('/teachers/:id', async (req, res) => {
  const { id } = req.params
  const result = await teachers.teacherStats(id)
  if (!result) {
    return res.status(404).send()
  }
  res.json(result)
})

module.exports = router