const { stan } = require('./src/nats_connection')
const { CronJob } = require('cron')
const Schedule = require('./models')
const logger = require('./logger')
const { updateStudentNumberList } = require('./src/student_list_updater')
const { scheduleActiveStudents, scheduleAllStudentsAndMeta, scheduleAttainmentUpdate } = require('./src/schedule_students')
const { getOldestTasks, getCurrentStatus } = require('./src/SchedulingStatistics')
require('./src/api')

const schedule = (cronTime, func) => new CronJob({ cronTime, onTick: func, start: true, timeZone: 'Europe/Helsinki' })

let updatedCount = 0
let scheduledCount = 0
let fetchedCount = 0

const updateTask = async (task, status, type, updatetime) => {
  if (type) {
    if (updatetime) {
      await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type }, { upsert: true })
    } else {
      await Schedule.findOneAndUpdate({ task }, { task, status, type }, { upsert: true })
    }
  } else {
    if (updatetime) {
      await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type: 'other', active: true }, { upsert: true })
    } else {
      await Schedule.findOneAndUpdate({ task }, { task, status, type: 'other', active: true }, { upsert: true })
    }
  }
}

stan.on('connect', async () => {
  schedule('0 0 2 * *', async () => {
    // Update ALL students and meta on 3nd of every month
    try {
      console.log('SCHEDULING ALL STUDENTS AND META')
      await scheduleAllStudentsAndMeta()
    } catch (err) {
      console.log('SCHEDULING ALL STUDENTS AND META FAILED')
      console.log(err)
      logger.info('failure', { service: 'SCHEDULER' })
    }
  })

  schedule('0 0 1 1,3,8,10 *', async () => {
    // Update student list 2nd of January, March, August, and October.”
    try {
      console.log('UPDATING STUDENT NUMBER LIST')
      await updateStudentNumberList()
    } catch (err) {
      console.log('UPDATING STUDENT NUMBER LIST FAILED')
      console.log(err)
      logger.info('failure', { service: 'SCHEDULER' })
    }
  })

  schedule('0 0 * * *', async () => {
    // Update ACTIVE students every night except few first dates of the month when we're updating all students anyway
    if (new Date().getDate() <= 5){
      console.log('NOT SCHEDULING ACTIVE STUDENTS BECAUSE BEGINNING OF MONTH WHEN ALL STUDENTS UPDATED ANYWAYS')
      return
    }
    try {
      console.log('SCHEDULING ACTIVE STUDENTS')
      await scheduleActiveStudents()
    } catch (err) {
      console.log('SCHEDULING ACTIVE STUDENTS FAILED')
      console.log(err)
      logger.info('failure', { service: 'SCHEDULER' })
    }
  })

  schedule('0 12 * * *', async () => {
    console.log('SCHEDULING ATTAINMENT UPDATE')
    await scheduleAttainmentUpdate()
  })

  schedule('*/5 * * * *', async () => {
    const oldestTasks = await getOldestTasks()
    const status = await getCurrentStatus()
    logger.info('oldestTasks', oldestTasks)
    logger.info('updaterStatus', status)
  })

  schedule('0 0-9 * * *', async () => {
    // Just log some statistics about updater during nights
    logger.info(`${updatedCount} TASKS DONE IN LAST HOUR\n ${scheduledCount} TASKS SCHEDULED IN LAST HOUR\n ${fetchedCount} TASKS FETCHED FROM API IN LAST HOUR`)
    updatedCount = 0
    fetchedCount = 0
    scheduledCount = 0
  })

  const scheduleSub = stan.subscribe('ScheduleAll')

  scheduleSub.on('message', async () => {
    scheduleAllStudentsAndMeta()
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
    const { task, status, timems } = data
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
    const isValidStudentId = (id) => {
      if (/^0\d{8}$/.test(id)) {
        // is a 9 digit number
        const multipliers = [7, 1, 3, 7, 1, 3, 7]
        const checksum = id
          .substring(1, 8)
          .split('')
          .reduce((sum, curr, index) => {
            return (sum + curr * multipliers[index]) % 10
          }, 0)
        return (10 - checksum) % 10 == id[8]
      }
      return false
    }
    const isStudent = !!isValidStudentId(task)
    logger.info(`Status changed for ${task} to ${status}`, { task: task, status: status, student: isStudent, timems: timems })
    await updateTask(task, status, isStudent ? 'student' : 'other', updatetime)
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

