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
  rescheduleScheduled,
  rescheduleFetched
} = require('./schedule_students')
const { getOldestTasks, getCurrentStatus } = require('./SchedulingStatistics')
const { updateStudentNumberList } = require('./student_list_updater')

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

app.post('/update/studentlist', async (req, res) => {
  updateStudentNumberList()
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
    oldestStudentNumberLisTask
  } = await getOldestTasks()

  const { allTasksScheduled, allTasksFetched, allTasksDone, allTasksCreated, allTasksActive } = await getCurrentStatus()

  statuses.push(
    { label: 'oldest student studentnumber', value: studentnumber},
    { label: 'oldest student timestamp', value: updatedAt},
    { label: 'oldest active student studentnumber', value: studentnumberActive},
    { label: 'oldest active student timestamp', value: updatedAtActive},
    { label: 'student status created', value: allTasksCreated},
    { label: 'student status scheduled', value: allTasksScheduled},
    { label: 'student status fetched', value: allTasksFetched},
    { label: 'student status done', value: allTasksDone},
    { label: 'student type active', value: allTasksActive},
    { label: 'oldest metadata update', value: oldestMetaTask.updatedAt},
    { label: 'current metadata status', value: oldestMetaTask.status},
    { label: 'oldest attainment update', value: oldestAttainmentTask.updatedAt},
    { label: 'current attainment status', value: oldestAttainmentTask.status},
    { label: 'oldest studentnumberlist update', value: oldestStudentNumberLisTask.updatedAt},
    { label: 'current studentnumberlist status', value: oldestStudentNumberLisTask.status},
  )

  res.json(statuses)
})

app.listen(port, () => console.log(`listening on port ${port}!`))
module.exports = { app }