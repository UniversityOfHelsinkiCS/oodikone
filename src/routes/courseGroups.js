const router = require('express').Router()

const CourseGroupService = require('../services/courseGroups')

router.get('/courseGroups', async (req, res) => {
  const courseGroups = await CourseGroupService.getCourseGroupsWithTotals()
  res.json(courseGroups)
})

router.get('/courseGroups/:id/teachers', async (req, res) => {
  const teachers = CourseGroupService.getTeachersForCourseGroup(Number(req.params.id))

  return teachers ? res.send(teachers) : res.send(404)
})

router.get('/courseGroups/teachers', async (req, res) => {
  const teacherIds = JSON.parse(req.query.teacherIds)

  if (!Array.isArray(teacherIds)) {
    res.send(400)
  }

  const courses = await CourseGroupService.getCoursesByTeachers(teacherIds)

  return courses ? res.send(courses) : res.send(404)
})

router.get('/courseGroups/:id', async (req, res) => {
  const groupData = await CourseGroupService.getCourseGroup(Number(req.params.id))

  return groupData ? res.send(groupData) : res.send(404)
})

module.exports = router
