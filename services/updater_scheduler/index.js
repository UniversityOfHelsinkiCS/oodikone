const stan = require('node-nats-streaming').connect('updaterNATS', 'scheduler', process.env.NATS_URI)
const cron = require('node-cron');
const Schedule = require('./models')
const fs = require('fs');
const logger = require('./logger')

let updatedCount = 0

const updateTask = async (task, status, type) => {
  if (type) {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type, active }, { upsert: true })

  } else {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date() }, { upsert: true })
  }
}
const testpopulate = async () => {
  await updateTask('meta', 'CREATED', 'other')
  const students = fs.readFileSync(process.env.STUDENT_NUMBERS).toString().split("\n")
  const activeStudents = fs.readFileSync(process.env.ACTIVE_STUDENTS).toString().split("\n")
  const taskStudents = students.map(student => ({ task: student, status: 'CREATED', updatedAt: new Date(), type: 'student', active: student.includes(activeStudents) }))
  Schedule.collection.insert(taskStudents, () => console.log('ayyyy'))
  console.log('täskit tehty lol')
}

stan.on('connect', async () => {
  // await testpopulate()

  cron.schedule('0 0 1 * *', async () => {
    // Update ALL students and meta every month

    const tasks =['meta', ...( await Schedule.find({ type: 'student' }).sort({ 'updatedAt': 1 }))]
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
  })

  cron.schedule('0 0-9 * * *', async () => {
    // Just log some statistics about updater during nights
    logger.info(`${updatedCount} TASKS DONE IN LAST HOUR`)
    updatedCount = 0
  })
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
  })

  const statusSub = stan.subscribe('status')

  statusSub.on('message', async (msg) => {
    const message = msg.getData().split(':')
    if (message[1] === 'DONE') {
      updatedCount = updatedCount + 1
    }
    await updateTask(message[0], message[1])
  })
})

