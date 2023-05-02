const {
  getCriteria,
  saveYearlyCourseCriteria,
  saveYearlyCreditCriteria,
} = require('../services/studyProgrammeCriteria')

const router = require('express').Router()

router.get('/', async (req, res) => {
  const studyProgramme = req.query?.programmecode
  if (studyProgramme !== '' && !studyProgramme) return res.status(422).end()
  const studyProgrammeCriteria = await getCriteria(studyProgramme)
  return res.json(studyProgrammeCriteria)
})

router.post('/courses', async (req, res) => {
  const { code, courses, year } = req.body
  if (!code || !courses || !year) return res.status(400).end()
  const studyProgrammeCriteria = await saveYearlyCourseCriteria(code, courses, year)
  return res.json(studyProgrammeCriteria)
})

router.post('/credits', async (req, res) => {
  const { code, credits } = req.body
  if (!code || !credits) return res.status(400).end()
  const studyProgrammeCriteria = await saveYearlyCreditCriteria(code, credits)
  return res.json(studyProgrammeCriteria)
})

module.exports = router
