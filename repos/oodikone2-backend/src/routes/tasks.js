const router = require('express').Router()
const { getTeacherUpdateStatus, startTopTeacherUpdate } = require('../services/tasks')

router.get('/tasks/topteachers', (_, res) => {
  const status = getTeacherUpdateStatus()
  res.json(status)
})

router.post('/tasks/topteachers', async (req, res) => {
  const { from = 50, to = 70 } = req.body
  const { computing } = getTeacherUpdateStatus()
  if (computing === true) {
    res.status(409).send('Task already exists')
  } else {
    startTopTeacherUpdate(from, to)
    res.status(201).send()
  }
})

module.exports = router