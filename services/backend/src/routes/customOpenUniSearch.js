const router = require('express').Router()
const { getCustomOpenUniCourses } = require('../services/openUni/openUniStats')

// post used insead of get because of the possible huge amount of the courses
router.post('/', async (req, res) => {
  const courseCodes = req.body?.courselist || []
  if (!courseCodes) return res.status(400).json({ error: 'Courses missing' })
  if (!Array.isArray(courseCodes)) res.status(400).json({ error: 'Courses must be of type array' })
  const customOpenUniSearches = await getCustomOpenUniCourses(courseCodes)
  res.json(customOpenUniSearches)
})

module.exports = router
