const stan = require('node-nats-streaming').connect('updaterNATS', 'scheduler', process.env.NATS_URI)
const cron = require('node-cron');
const Schedule = require('./models')
const fs = require('fs');
const logger = require('./logger')
const { updateStudentNumberList } = require('./student_list_updater')

let updatedCount = 0
let scheduledCount = 0
let fetchedCount = 0

const TIMEZONE = 'Europe/Helsinki'

const updateTask = async (task, status, type) => {
  if (type) {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type, active }, { upsert: true })

  } else {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type: 'other', active: true }, { upsert: true })
  }
}

stan.on('connect', async () => {
  cron.schedule('0 0 1 * *', async () => {
    // Update ALL students and meta every month

    const tasks =['meta', ...( await Schedule.find({ type: 'student' }))]
    for (const task of tasks) {
      stan.publish('UpdateApi', task.task, (err, guid) => {
        if (err) {
          console.log('publish failed')
        }
      })
      stan.publish('status', `${task.task}:SCHEDULED`, (err) => {
        if (err) {
          console.log('publish failed')
        }
      })
    }
  }, { TIMEZONE })

  cron.schedule('20 4 1 1,3,8,10 *', async () => {
    // At 04:20 on day-of-month 1 in January, March, August, and October.”
    updateStudentNumberList()
  })
  cron.schedule('0 23 * * *', async () => {
    // Update ACTIVE students every night

    const tasks = [await Schedule.find({ type: 'student', active: true }).sort({ 'updatedAt': 1 })]
    for (const task of tasks) {
      stan.publish('UpdateApi', task.task, (err, guid) => {
        if (err) {
          console.log('publish failed')
        }
      })
      stan.publish('status', `${task.task}:SCHEDULED`, (err) => {
        if (err) {
          console.log('publish failed')
        }
      })
    }
  }, { TIMEZONE })

  cron.schedule('0 0-9 * * *', async () => {
    // Just log some statistics about updater during nights
    logger.info(`${updatedCount} TASKS DONE IN LAST HOUR\n ${scheduledCount} TASKS SCHEDULED IN LAST HOUR\n ${fetchedCount} TASKS FETCHED FROM API IN LAST HOUR`)
    updatedCount = 0
    fetchedCount = 0
    scheduledCount = 0
  }, { TIMEZONE })
  cron.schedule('* 7 * * *', async () => {
    stan.publish('RefreshOverview', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'RefreshOverview')
      } else {
        console.log('published', 'RefreshOverview')
      }
    })
    stan.publish('RefreshStudyrightAssociations', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'RefreshStudyrightAssociations')
      } else {
        console.log('published', 'RefreshStudyrightAssociations')
      }
    })
    stan.publish('updateAttainmentDates', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'UpdateAttainmentDates')
      } else {
        console.log('published', 'UpdateAttainmentDates')
      }
    })
  }, { TIMEZONE })

  const statusSub = stan.subscribe('status')

  statusSub.on('message', async (msg) => {
    const message = msg.getData().split(':')

    switch (message[1]) {
      case 'DONE':
        updatedCount = updatedCount + 1
        break
      case 'FETCHED':
        fetchedCount = fetchedCount + 1
        break
      case 'SCHEDULED':
        scheduledCount = scheduledCount + 1
        break
    }
    await updateTask(message[0], message[1])
  })
})

