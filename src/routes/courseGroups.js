const router = require('express').Router()

const CourseGroupService = require('../services/courseGroups')

router.get('/courseGroups', async (req, res) => {
  res.json([
    { id: 1, name: 'Erityispedagogiikka' },
    { id: 2, name: 'Kasvatuspsykologia' }
  ])
})

router.get('/courseGroups/:id/teachers', async (req, res) => {
  const teachers = CourseGroupService.getTeachersForCourseGroup(parseInt(req.params.id, 10))

  return teachers ? res.send(teachers) : res.send(404)
})

module.exports = router
