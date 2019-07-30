const { stan } = require('./src/nats_connection')
const cron = require('node-cron')
const Schedule = require('./models')
const logger = require('./logger')
const { updateStudentNumberList } = require('./src/student_list_updater')
const { scheduleActiveStudents, scheduleAllStudentsAndMeta } = require('./src/schedule_students')
const { getOldestTasks, getCurrentStatus } = require('./src/SchedulingStatistics')
require('./src/api')

let updatedCount = 0
let scheduledCount = 0
let fetchedCount = 0

const timezone = 'Europe/Helsinki'

const updateTask = async (task, status, type) => {
  if (type) {
    if (status === 'DONE') {
      await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type }, { upsert: true })
    } else {
      await Schedule.findOneAndUpdate({ task }, { task, status, type }, { upsert: true })
    }
  } else {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type: 'other', active: true }, { upsert: true })
  }
}

stan.on('connect', async () => {
  cron.schedule('0 0 1 * *', async () => {
    // Update ALL students and meta every month
    try {
      await scheduleAllStudentsAndMeta()
    } catch (err) {
      console.log('SCHEDULING ALL STUDENTS AND META FAILED')
      console.log(err)
    }
  }, { timezone })

  cron.schedule('20 4 1 1,3,8,10 *', async () => {
    // At 04:20 on day-of-month 1 in January, March, August, and October.”
    try {
      await updateStudentNumberList()
    } catch (err) {
      console.log('UPDATING STUDENT NUMBER LIST FAILED')
      console.log(err)
    }
  }, { timezone })

  // cron.schedule('0 * * * *'), async () => {
  //   const allStudentTasks = await Schedule.find({ type: 'student' })
  //   if (allStudentTasks && allStudentTasks.every(task => task.status === 'DONE')) {
  //     stan.publish('DumpDatabase', null, (err, guid) => {
  //       if (err) {
  //         console.log('publish failed', 'DumpDatabase')
  //       } else {
  //         console.log('published', 'DumpDatabase')
  //       }
  //     })
  //   }
  // }

  cron.schedule('0 23 * * *', async () => {
    // Update ACTIVE students every night except few first dates of the month when we're updating all students anyway
    if (new Date().getDate() <= 5){
      return
    }
    try {
      await scheduleActiveStudents()
    } catch (err) {
      console.log('SCHEDULING ACTIVE STUDENTS FAILED')
      console.log(err)
    }
  }, { timezone })

  cron.schedule('*/5 * * * *', async () => {
    const oldestTasks = await getOldestTasks()
    const status = await getCurrentStatus()
    logger.info('oldestTasks', oldestTasks)
    logger.info('updaterStatus', status)
  }, { timezone })

  cron.schedule('0 0-9 * * *', async () => {
    // Just log some statistics about updater during nights
    logger.info(`${updatedCount} TASKS DONE IN LAST HOUR\n ${scheduledCount} TASKS SCHEDULED IN LAST HOUR\n ${fetchedCount} TASKS FETCHED FROM API IN LAST HOUR`)
    updatedCount = 0
    fetchedCount = 0
    scheduledCount = 0
  }, { timezone })

  cron.schedule('0 7 * * *', async () => {
    stan.publish('updateAttainmentDates', null, (err) => {
      if (err) {
        console.log('publish failed', 'UpdateAttainmentDates')
      } else {
        console.log('published', 'UpdateAttainmentDates')
      }
    })
  }, { timezone })

  const scheduleSub = stan.subscribe('ScheduleAll')

  scheduleSub.on('message', async () => {
    scheduleAllStudentsAndMeta()
  })
  const opts = stan.subscriptionOptions()
  opts.setManualAckMode(true)
  opts.setAckWait(30 * 60 * 1000) // 1min
  // opts.setDeliverAllAvailable()
  // opts.setDurableName('durable')
  opts.setMaxInFlight(20)

  const statusSub = stan.subscribe('status', opts)

  const handleStatusMessage = async (msg) => {
    const message = msg.getData().split(':')
    const task = message[0]
    const status = message[1]

    switch (status) {
    case 'DONE':
      updatedCount = updatedCount + 1
      break
    case 'FETCHED':
      fetchedCount = fetchedCount + 1
      break
    case 'SCHEDULED':
      scheduledCount = scheduledCount + 1
      break
    default:
      throw 'unknown status in status message'
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
    logger.info(`Status changed for ${task} to ${status}`, { task: task, status: status, student: isStudent })
    await updateTask(task, status, isStudent ? 'student' : 'other')
  }
  statusSub.on('message', async (msg) => {
    try {
      await handleStatusMessage(msg)
    } catch (err) {
      console.log(err)
    }
    msg.ack()
  })

})

