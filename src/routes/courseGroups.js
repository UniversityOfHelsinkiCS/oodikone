const router = require('express').Router()

const CourseGroupService = require('../services/courseGroups')

const BASE_PATH = '/course-groups'

router.get(BASE_PATH, async (req, res) => {
  const semesterCode = req.query.semester
  const courseGroups = await CourseGroupService.getCourseGroupsWithTotals(semesterCode)
  res.json(courseGroups)
})

router.get(`${BASE_PATH}/academic-years`, async (req, res) => {
  const academicYears = await CourseGroupService.getAcademicYears()
  res.json(academicYears)
})

router.get(`${BASE_PATH}/:id/teachers`, async (req, res) => {
  const teachers = CourseGroupService.getTeachersForCourseGroup(Number(req.params.id))

  return teachers ? res.send(teachers) : res.send(404)
})

router.get(`${BASE_PATH}/teachers`, async (req, res) => {
  const { teacherIds: ids, semester } = req.query
  const teacherIds = JSON.parse(ids)

  if (!Array.isArray(teacherIds)) {
    res.send(400)
  }

  const courses = await CourseGroupService.getCoursesByTeachers(teacherIds, semester)

  return courses ? res.send(courses) : res.send(404)
})

router.get(`${BASE_PATH}/:id`, async (req, res) => {
  const { id } = req.params
  const { semester } = req.query
  const groupData = await CourseGroupService.getCourseGroup(Number(id), semester)

  return groupData ? res.send(groupData) : res.send(404)
})

module.exports = router
