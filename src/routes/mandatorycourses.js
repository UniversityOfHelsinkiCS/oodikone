const router = require('express').Router()
const MandatoryCourses = require('../services/mandatoryCourses')

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const { course } = req.body
  console.log(id, course)
  if (id && course) {
    try {
      await MandatoryCourses.remove(id, course)
      res.status(200).json(course)
    } catch (err) {
      res.status(400).json(err)
    }
  } else {
    res.status(422)
  }
})

router.post('/:id', async (req, res) => {
  const { id } = req.params
  const { course } = req.body
  if (id && course) {
    try {
      await MandatoryCourses.create(id, course)
      res.status(201).json(course)
    } catch (err) {
      res.status(400).json(err)
    }
  } else {
    res.status(422)
  }
})

module.exports = router