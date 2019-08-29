const { stan } = require('./src/nats_connection')
const { CronJob } = require('cron')
const Schedule = require('./models')
const logger = require('./logger')
const { scheduleDaily, scheduleAllStudents, scheduleAttainmentUpdate, scheduleMeta } = require('./src/schedule_students')
const { isValidStudentId } = require('./src/util')
require('./src/api')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

let updatedCount = 0
let scheduledCount = 0
let fetchedCount = 0

const updateTask = async ({ task, status, type, updatetime, active }) => {
  const doc = { task, status, type }
  if (updatetime) doc.updatedAt = new Date()
  if (active != null) doc.active = active
  await Schedule.findOneAndUpdate({ task }, doc, { upsert: true })
}

stan.on('connect', async () => {
  if (process.env.NODE_ENV === 'production') {
    schedule('0 0 * * 6', async () => {
      // Every Friday-Saturday midnight
      try {
        console.log('SCHEDULING ALL STUDENTS')
        await scheduleAllStudents()
      } catch (err) {
        console.log('SCHEDULING ALL STUDENTS FAILED')
        console.log(err)
        logger.info('failure', { service: 'SCHEDULER' })
      }
    })

    schedule('0 6 * * 1-5', async () => {
      // Every Monday through Friday at 06:00
      try {
        console.log('SCHEDULING META AND ATTAINMENT')
        await scheduleMeta()
        await scheduleAttainmentUpdate()
      } catch (err) {
        console.log('SCHEDULING META AND ATTAINMENT')
        console.log(err)
        logger.info('failure', { service: 'SCHEDULER' })
      }
    })

    schedule('0 20 * * 1-4', async () => {
      // Every Monday through Thursday at 20:00
      try {
        console.log('SCHEDULING DAILY TASKS')
        await scheduleDaily()
      } catch (err) {
        console.log('SCHEDULING DAILY TASKS FAILED')
        console.log(err)
        logger.info('failure', { service: 'SCHEDULER' })
      }
    })
  }

  schedule('0 * * * *', async () => {
    // Every hour
    logger.info(`${updatedCount} TASKS DONE IN LAST HOUR. ${scheduledCount} TASKS SCHEDULED IN LAST HOUR. ${fetchedCount} TASKS FETCHED FROM API IN LAST HOUR`)
    updatedCount = 0
    fetchedCount = 0
    scheduledCount = 0
  })

  const opts = stan.subscriptionOptions()
  opts.setManualAckMode(true)
  opts.setAckWait(5 * 60 * 1000)
  // opts.setDeliverAllAvailable()
  // opts.setDurableName('durable')
  opts.setMaxInFlight(20)

  const statusSub = stan.subscribe('status', opts)

  const handleStatusMessage = async (msg) => {
    const data = JSON.parse(msg.getData())
    const { task, status, timems, active, priority } = data
    let updatetime = false
    switch (status) {
    case 'DONE':
    case 'NO_STUDENT':
      updatedCount = updatedCount + 1
      updatetime = true
      break
    case 'FETCHED':
      fetchedCount = fetchedCount + 1
      break
    case 'SCHEDULED':
      scheduledCount = scheduledCount + 1
      break
    default:
      throw 'unknown status: ' + msg.getData()
    }
    const isStudent = !!isValidStudentId(task)
    logger.info(`Status changed for ${task} to ${status}`, { task, status, student: isStudent, timems, active, priority })
    await updateTask({ task, status, type: isStudent ? 'student' : 'other', updatetime, active })
  }
  statusSub.on('message', async (msg) => {
    try {
      await handleStatusMessage(msg)
    } catch (err) {
      console.log(err)
      logger.info('failure', { service: 'SCHEDULER' })
    }
    msg.ack()
  })

})

