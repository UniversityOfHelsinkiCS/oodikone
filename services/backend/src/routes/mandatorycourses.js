const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')

router.delete('/:programme', async (req, res) => {
  const { programme } = req.params
  const { course } = req.body
  if (!programme || !course) return res.status(400).end()
  await MandatoryCourses.remove(programme, course)
  res.status(200).json(course)
})

router.post('/:programme', async (req, res) => {
  const { programme } = req.params
  const { course } = req.body
  if (!programme || !course) return res.status(400).end()
  await MandatoryCourses.create(programme, course)
  const newCourse = await MandatoryCourses.find(programme, course)
  if (!newCourse) return res.status(400).end()
  res.status(201).json({ name: newCourse.course.name, code: newCourse.course_code, label: newCourse.label })
})

router.post('/:programme/label/:course', async (req, res) => {
  const { programme, course } = req.params
  const { label } = req.body
  if (!programme || !course) return res.status(400).end()
  await MandatoryCourses.updateLabel(programme, course, label)
  const updatedCourse = await MandatoryCourses.find(programme, course)
  if (!updatedCourse) return res.status(400).end()
  res.status(200).json({
    name: updatedCourse.course.name,
    code: updatedCourse.course_code,
    label: updatedCourse.mandatory_course_label,
  })
})

module.exports = router
