const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')

router.delete('/:programme', async (req, res) => {
  const { programme } = req.params
  const { course } = req.body
  if (programme && course) {
    try {
      await MandatoryCourses.remove(programme, course)
      res.status(200).json(course)
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

router.post('/:programme', async (req, res) => {
  const { programme } = req.params
  const { course } = req.body
  if (programme && course) {
    try {
      await MandatoryCourses.create(programme, course)
      const newCourse = await MandatoryCourses.find(programme, course)
      res.status(201).json({ name: newCourse.course.name, code: newCourse.course_code, label: newCourse.label })
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

router.post('/:programme/label/:course', async (req, res) => {
  const { programme, course } = req.params
  const { label } = req.body
  if (programme && course) {
    try {
      await MandatoryCourses.updateLabel(programme, course, label)
      const updatedCourse = await MandatoryCourses.find(programme, course)
      res
        .status(200)
        .json({
          name: updatedCourse.course.name,
          code: updatedCourse.course_code,
          label: updatedCourse.label
        })
    } catch (err) {
      console.error(err)
      res.status(400).json(err.message)
    }
  } else {
    res.status(422).end()
  }
})

module.exports = router