const router = require('express').Router()
const { all } = require('../services/organisations')
const { byType: getElementDetailsByType } = require('../services/elementdetails')
const { getFacultyYearlyStats } = require('../servicesV2/analyticsService')

router.get('/faculties', async (req, res) => {
  const { roles, faculties } = req
  const allFaculties = await all()
  res.json(roles.includes('admin') ? allFaculties : allFaculties.filter(({ code }) => faculties.has(code)))
})

router.get('/yearlystats', async (req, res) => {
  try {
    const { roles, faculties } = req
    const facultyYearlyStats = await getFacultyYearlyStats()
    res.json(roles.includes('admin') ? facultyYearlyStats : facultyYearlyStats.filter(({ id }) => faculties.has(id)))
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

router.get('/programmes', async (req, res) => {
  try {
    const { roles } = req
    const isAdmin = roles.includes('admin')
    const facultyProgrammes = await getElementDetailsByType(20)
    const userRightsSet = new Set(req.rights)
    res.json(facultyProgrammes.filter(({ code }) => userRightsSet.has(code) || isAdmin))
  } catch (e) {
    res.status(400).json({ error: e })
  }
})

module.exports = router
