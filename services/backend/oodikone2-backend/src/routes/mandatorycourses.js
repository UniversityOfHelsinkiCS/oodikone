const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')

router.delete('/:programme', async (req, res) => {
  const { programme } = req.params
  const { course } = req.body
  if (!programme || !course) return res.status(400).end()
  try {
    await MandatoryCourses.remove(programme, course)
    res.status(200).json(course)
  } catch (err) {
    console.error(err)
    res.status(500).json(err.message)
  }
})

router.post('/:programme', async (req, res) => {
  const { programme } = req.params
  const { course } = req.body
  if (!programme || !course) return res.status(400).end()
  try {
    await MandatoryCourses.create(programme, course)
    const newCourse = await MandatoryCourses.find(programme, course)
    if (!newCourse) return res.status(400).end()
    res.status(201).json({ name: newCourse.course.name, code: newCourse.course_code, label: newCourse.label })
  } catch (err) {
    console.error(err)
    res.status(500).json(err.message)
  }
})

router.post('/:programme/label/:course', async (req, res) => {
  const { programme, course } = req.params
  const { label } = req.body
  if (!programme || !course) return res.status(400).end()
  try {
    await MandatoryCourses.updateLabel(programme, course, label)
    const updatedCourse = await MandatoryCourses.find(programme, course)
    if (!updatedCourse) return res.status(400).end()
    res
      .status(200)
      .json({
        name: updatedCourse.course.name,
        code: updatedCourse.course_code,
        label: updatedCourse.mandatory_course_label
      })
  } catch (err) {
    console.error(err)
    res.status(500).json(err.message)
  }
})

module.exports = router