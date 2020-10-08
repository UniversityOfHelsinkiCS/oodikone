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
  rescheduleCreated,
  scheduleDaily
} = require('./schedule_students')
const { getOldestTasks, getCurrentStatus } = require('./SchedulingStatistics')
const { createTasks } = require('./student_list_updater')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong ' }))

app.post('/update', async (req, res) => {
  await createTasks(req.body)
  const scheduled = await scheduleStudentsByArray(req.body)
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/update/oldest', async (req, res) => {
  const { amount } = req.body
  const scheduled = await scheduleOldestNStudents(amount)
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/update/all', async (req, res) => {
  const scheduled = await scheduleAllStudents()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/update/active', async (req, res) => {
  const scheduled = await scheduleActiveStudents()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/update/attainment', async (req, res) => {
  scheduleAttainmentUpdate()
  res.json({ message: `scheduled attainments` })
})

app.post('/update/meta', async (req, res) => {
  scheduleMeta()
  res.json({ message: 'scheduled meta' })
})

app.post('/update/no_student', async (req, res) => {
  const scheduled = await scheduleStudentCheck()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/update/studentlist', async (req, res) => {
  createTasks()
  res.json({ message: `tasks created` })
})

app.post('/update/daily', async (req, res) => {
  const scheduled = await scheduleDaily()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/reschedule/created', async (req, res) => {
  const scheduled = await rescheduleCreated()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/reschedule/scheduled', async (req, res) => {
  const scheduled = await rescheduleScheduled()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.post('/reschedule/fetched', async (req, res) => {
  const scheduled = await rescheduleFetched()
  res.json({ message: `scheduled ${scheduled} updates` })
})

app.get('/statuses', async (req, res) => {
  const statuses = []

  const {
    oldestChangedStatus: { studentnumber, updatedAt },
    oldestActiveStudentDone: { studentnumber: studentnumberActive, updatedAt: updatedAtActive },
    oldestMetaTask,
    oldestAttainmentTask
  } = await getOldestTasks()

  const {
    allTasksScheduled,
    allTasksFetched,
    allTasksDone,
    allTasksCreated,
    allTasksActive,
    allTasksNoStudent
  } = await getCurrentStatus()

  statuses.push(
    { label: 'CREATED', value: allTasksCreated },
    { label: 'SCHEDULED', value: allTasksScheduled },
    { label: 'FETCHED', value: allTasksFetched },
    { label: 'DONE', value: allTasksDone },
    { label: 'NO_STUDENT', value: allTasksNoStudent },
    { label: 'ACTIVE', value: allTasksActive },
    { label: 'oldest student studentnumber', value: studentnumber },
    { label: 'oldest student timestamp', value: updatedAt },
    { label: 'oldest active student studentnumber', value: studentnumberActive },
    { label: 'oldest active student timestamp', value: updatedAtActive },
    { label: 'oldest metadata update', value: oldestMetaTask.updatedAt },
    { label: 'current metadata status', value: oldestMetaTask.status },
    { label: 'oldest attainment update', value: oldestAttainmentTask.updatedAt },
    { label: 'current attainment status', value: oldestAttainmentTask.status }
  )

  res.json(statuses)
})

app.listen(port, () => console.log(`listening on port ${port}!`))
module.exports = { app }
