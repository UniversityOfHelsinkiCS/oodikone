const router = require('express').Router()
const { getCompletedCourses } = require('../services/prerequisiteSearch')

router.get('/', async (req, res) => {
  const studentNumbers = JSON.parse(req.query?.studentlist) || []
  const courseCodes = JSON.parse(req.query?.courselist) || []

  if (!Array.isArray(studentNumbers)) return res.status(400).json({ error: 'Student numbers must be of type array' })
  if (!Array.isArray(courseCodes)) return res.status(400).json({ error: 'Courses must be of type array' })

  const completedCourses = await getCompletedCourses(studentNumbers, courseCodes)
  return res.json(completedCourses)
})

module.exports = router
