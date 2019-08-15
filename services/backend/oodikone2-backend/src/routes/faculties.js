const router = require('express').Router()
const { all } = require('../services/organisations')
const { byType: getElementDetailsByType } = require('../services/elementdetails')
const { getFacultyYearlyStats } = require('../services/analyticsService')

router.get('/faculties', async (req, res) => {
  const faculties = await all()
  res.json(faculties)
})

router.get('/faculties/yearlystats', async (req, res) => {
  try {
    const facultyYearlyStats = await getFacultyYearlyStats()
    res.status(200).json(facultyYearlyStats)
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/faculties/programmes', async (req, res) => {
  try {
    const facultyProgrammes = await getElementDetailsByType(20)
    res.json(facultyProgrammes)
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

module.exports = router