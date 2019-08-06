const express = require('express')
const app = express()
const port = process.env.PORT
const bodyParser = require('body-parser')
const {
  scheduleStudentsByArray,
  scheduleOldestNStudents,
  scheduleAllStudents,
  scheduleActiveStudents,
  scheduleMeta,
  scheduleAttainmentUpdate,
  scheduleStudentCheck,
  rescheduleScheduled,
  rescheduleFetched,
  rescheduleCreated
} = require('./schedule_students')
const { getOldestTasks, getCurrentStatus } = require('./SchedulingStatistics')
const { createTasks } = require('./student_list_updater')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong '}))

app.post('/update', async (req, res) => {
  scheduleStudentsByArray(req.body)
  res.json({ message: 'scheduled' })
})

app.post('/update/oldest', async (req, res) => {
  const { amount } = req.body
  scheduleOldestNStudents(amount)
  res.json({ message: 'scheduled' })
})

app.post('/update/all', async (req, res) => {
  scheduleAllStudents()
  res.json({ message: 'scheduled' })
})

app.post('/update/active', async (req, res) => {
  scheduleActiveStudents()
  res.json({ message: 'scheduled' })
})

app.post('/update/attainment', async (req, res) => {
  scheduleAttainmentUpdate()
  res.json({ message: 'scheduled' })
})

app.post('/update/meta', async (req, res) => {
  scheduleMeta()
  res.json({ message: 'scheduled' })
})

app.post('/update/no_student', async (req, res) => {
  scheduleStudentCheck()
  res.json({ message: 'scheduled' })
})

app.post('/update/studentlist', async (req, res) => {
  createTasks()
  res.json({ message: 'scheduled' })
})

app.post('/reschedule/created', async (req, res) => {
  rescheduleCreated()
  res.json({ message: 'scheduled' })
})

app.post('/reschedule/scheduled', async (req, res) => {
  rescheduleScheduled()
  res.json({ message: 'scheduled' })
})

app.post('/reschedule/fetched', async (req, res) => {
  rescheduleFetched()
  res.json({ message: 'scheduled' })
})

app.get('/statuses', async (req, res) => {
  const statuses = []

  const {
    oldestChangedStatus: {
      studentnumber,
      updatedAt
    },
    oldestActiveStudentDone: {
      studentnumber: studentnumberActive,
      updatedAt: updatedAtActive
    },
    oldestMetaTask,
    oldestAttainmentTask,
  } = await getOldestTasks()

  const { allTasksScheduled, allTasksFetched, allTasksDone, allTasksCreated, allTasksActive, allTasksNoStudent } = await getCurrentStatus()

  statuses.push(
    { label: 'CREATED', value: allTasksCreated},
    { label: 'SCHEDULED', value: allTasksScheduled},
    { label: 'FETCHED', value: allTasksFetched},
    { label: 'DONE', value: allTasksDone},
    { label: 'NO_STUDENT', value: allTasksNoStudent},
    { label: 'ACTIVE', value: allTasksActive},
    { label: 'oldest student studentnumber', value: studentnumber},
    { label: 'oldest student timestamp', value: updatedAt},
    { label: 'oldest active student studentnumber', value: studentnumberActive},
    { label: 'oldest active student timestamp', value: updatedAtActive},
    { label: 'oldest metadata update', value: oldestMetaTask.updatedAt},
    { label: 'current metadata status', value: oldestMetaTask.status},
    { label: 'oldest attainment update', value: oldestAttainmentTask.updatedAt},
    { label: 'current attainment status', value: oldestAttainmentTask.status},
  )

  res.json(statuses)
})

app.listen(port, () => console.log(`listening on port ${port}!`))
module.exports = { app }