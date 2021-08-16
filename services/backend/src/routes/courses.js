const router = require('express').Router()
const Course = require('../services/courses')
const coursesV2 = require('../routesV2/courses')
const useSisRouter = require('../util/useSisRouter')

router.get('/coursetypes', async (req, res) => {
  const coursetypes = await Course.getAllCourseTypes()
  res.json(coursetypes)
})

router.get('/coursedisciplines', async (req, res) => {
  const courseDisciplines = await Course.getAllDisciplines()
  res.json(courseDisciplines)
})

router.get('/courses/duplicatecodes/:programme', async (req, res) => {
  // const { programme } = req.params
  const results = await Course.getMainCourseToCourseMap()
  return res.json(results)
})

router.post('/courses/duplicatecodes/:code1/:code2', async (req, res) => {
  const { code1, code2 } = req.params
  await Course.setDuplicateCode(code1, code2)
  const results = await Course.getMainCourseToCourseMap()
  res.status(200).json(results)
})

router.delete('/courses/duplicatecodes/:code', async (req, res) => {
  const { code } = req.params
  await Course.deleteDuplicateCode(code)
  const results = await Course.getMainCourseToCourseMap()
  res.status(200).json(results)
})

module.exports = useSisRouter(coursesV2, router)
