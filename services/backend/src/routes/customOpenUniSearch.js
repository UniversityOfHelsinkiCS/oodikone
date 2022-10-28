const router = require('express').Router()
const { getCustomOpenUniCourses } = require('../services/openUni/openUniStats')

// Method POST used insead of GET because of the possible huge amount of the course_codes
router.post('/', async (req, res) => {
  const courseCodes = req.body?.courselist || []
  if (!courseCodes) return res.status(400).json({ error: 'Courses missing' }).end()
  if (!Array.isArray(courseCodes)) res.status(400).json({ error: 'Courses must be of type array' }).end()
  const customOpenUniSearches = await getCustomOpenUniCourses(courseCodes)
  res.json(customOpenUniSearches)
})

module.exports = router
