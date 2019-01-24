const router = require('express').Router()

const CourseGroupService = require('../services/courseGroups')

const BASE_PATH = '/'

router.get(BASE_PATH, async (req, res) => {
  const semesterCode = req.query.semester
  const courseGroups = await CourseGroupService.getCourseGroupsWithTotals(semesterCode)
  return res.json(courseGroups)
})

router.get(`${BASE_PATH}academic-years`, async (req, res) => {
  const academicYears = await CourseGroupService.getAcademicYears()
  return res.json(academicYears)
})

router.get(`${BASE_PATH}courses`, async (req, res) => {
  const { teacherIds: ids, semester } = req.query
  const teacherIds = ids && JSON.parse(ids)

  if (!teacherIds || !Array.isArray(teacherIds)) {
    return res.sendStatus(400)
  }

  if (teacherIds.length === 0) return res.send([])

  const courses = await CourseGroupService.getCoursesByTeachers(teacherIds, semester)

  return courses ? res.send(courses) : res.sendStatus(404)
})

router.get(`${BASE_PATH}:id`, async (req, res) => {
  const { id } = req.params
  const { semester } = req.query
  const groupData = await CourseGroupService.getCourseGroup(Number(id), Number(semester))

  return groupData ? res.send(groupData) : res.sendStatus(404)
})

router.post(`${BASE_PATH}/:id/add/:teacherid`, async (req, res) => {
  const { id, teacherid } = req.params
  const success = await CourseGroupService.addTeacher(Number(id), teacherid)

  return success ? res.status(200).json('added') : res.sendStatus(404)
})

router.post(`${BASE_PATH}/:id/remove/:teacherid`, async (req, res) => {
  const { id, teacherid } = req.params
  const success = await CourseGroupService.removeTeacher(Number(id), teacherid)

  return success ? res.status(200).json('removed') : res.sendStatus(404)
})

module.exports = router
