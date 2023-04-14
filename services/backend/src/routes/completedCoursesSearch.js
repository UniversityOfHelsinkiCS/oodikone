const router = require('express').Router()
const { getCompletedCourses } = require('../services/completedCoursesSearch')
const _ = require('lodash')

router.get('/', async (req, res) => {
  const studentNumbers = JSON.parse(req.query?.studentlist) || []
  const courseCodes = JSON.parse(req.query?.courselist) || []
  const {
    user: { isAdmin, studentsUserCanAccess },
  } = req
  if (!Array.isArray(studentNumbers)) return res.status(400).json({ error: 'Student numbers must be of type array' })
  if (!Array.isArray(courseCodes)) return res.status(400).json({ error: 'Courses must be of type array' })

  const filteredStudentNumbers = isAdmin ? studentNumbers : _.intersection(studentNumbers, studentsUserCanAccess)
  const completedCourses = await getCompletedCourses(filteredStudentNumbers, courseCodes)
  return res.json(completedCourses)
})

module.exports = router
