const router = require('express').Router()

const CourseGroupService = require('../services/courseGroups')

router.get('/courseGroups', async (req, res) => {
  const courseGroups = await CourseGroupService.getCourseGroupsWithTotals()

  res.json(courseGroups)
})

router.get('/courseGroups/:id/teachers', async (req, res) => {
  const teachers = CourseGroupService.getTeachersForCourseGroup(parseInt(req.params.id, 10))

  return teachers ? res.send(teachers) : res.send(404)
})

module.exports = router
