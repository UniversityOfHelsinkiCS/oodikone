const router = require('express').Router()
const teachers = require('../services/teachers')
const topteachers = require('../services/topteachers')

router.get('/teachers', async (req, res) => {
  const { searchTerm } = req.query
  const result = await teachers.bySearchTerm(searchTerm)
  res.json(result)
})

router.get('/teachers/top', async (req, res) => {
  const { yearcode, category = topteachers.ID.ALL } = req.query
  if (!yearcode) {
    return res.status(422).send('Missing required yearcode query param')
  }
  const result = await topteachers.getTeacherStats(category, yearcode)
  res.json(result)
})

router.get('/teachers/top/categories', async (req, res) => {
  const result = await topteachers.getCategoriesAndYears()
  res.json(result)
})

router.get('/teachers/stats', async (req, res) => {
  const { providers, semesterStart, semesterEnd } = req.query
  if (!providers || !semesterStart) {
    return res.status(422).send('Missing required query parameters.')
  }
  const result = await teachers.yearlyStatistics(providers, semesterStart, semesterEnd||semesterStart + 1)
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