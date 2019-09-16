const router = require('express').Router()
const { all } = require('../services/organisations')
const { byType: getElementDetailsByType } = require('../services/elementdetails')
const { getFacultyYearlyStats } = require('../services/analyticsService')

router.get('/faculties', async (req, res) => {
  const faculties = await all()
  res.json(faculties.filter(({ code }) => req.faculties.has(code)))
})

router.get('/yearlystats', async (req, res) => {
  try {
    const facultyYearlyStats = await getFacultyYearlyStats()
    res.status(200).json(facultyYearlyStats.filter(({ id }) => req.faculties.has(id)))
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/programmes', async (req, res) => {
  try {
    const facultyProgrammes = await getElementDetailsByType(20)
    const userRightsSet = new Set(req.rights)
    res.json(facultyProgrammes.filter(({ code }) => userRightsSet.has(code)))
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

module.exports = router
