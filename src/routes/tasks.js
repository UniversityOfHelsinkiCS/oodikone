const router = require('express').Router()
const { getTeacherUpdateStatus, startTopTeacherUpdate } = require('../services/tasks')

router.get('/tasks/topteachers', async (req, res) => {
  const status = await getTeacherUpdateStatus()
  res.json(status)
})

router.post('/tasks/topteachers', async (req, res) => {
  const { from = 50, to = 70 } = req.body
  startTopTeacherUpdate(from, to)
  res.status(201).send()
})

module.exports = router