const router = require('express').Router()
const Teacher = require('../services/teachers')

router.post('/teacherstatistics', async function (req, res) {
  const courses = req.body.courses.map(c => c.code)
  const fromDate = req.body.fromDate.split('.').join('-')
  const toDate = req.body.toDate.split('.').join('-')
  const minCourses = req.body.minCourses || 1
  const minStudents = req.body.minStudents || 1
  const studyRights = req.body.studyRights || 1

  const results = await Teacher.statisticsOf(courses, fromDate, toDate, minCourses, minStudents, studyRights)
  res.json(results)
})

module.exports = router
