const stan = require('node-nats-streaming').connect('updaterNATS', 'scheduler', process.env.NATS_URI)
const cron = require('node-cron');
const Schedule = require('./models')
const fs = require('fs');

const updateTask = async (task, status, type) => {
  if (type) {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date(), type }, { upsert: true })

  } else {
    await Schedule.findOneAndUpdate({ task }, { task, status, updatedAt: new Date() }, { upsert: true })
  }
}
const testpopulate = async () => {
  await updateTask('meta', 'CREATED', 'other')
  const students = fs.readFileSync(process.env.STUDENT_NUMBERS).toString().split("\n")
  const taskStudents = students.map(_ => ({ task: _, status: 'CREATED', updatedAt: new Date(), type: 'student' }))
  Schedule.collection.insert(taskStudents, () => console.log('ayyyy'))
  console.log('täskit tehty lol')
}
stan.on('connect', async () => {
  // await testpopulate()
  cron.schedule('* * * * *', async () => {
    const tasks = await Schedule.find({ type: 'student' }).limit(10).sort({ 'updatedAt': 1 })
    for (const task of tasks) {
      stan.publish('UpdateApi', task.task, (err, guid) => {
        if (err) {
          console.log('publish failed')
        }
      })
      stan.publish('status', `${task.task}:SCHEDULED`, (err) => {
        if(err) {
          console.log('publish failed')
        }
      })
    }
  })
  cron.schedule('* 3 * * *', async () => {
    stan.publish('RefreshOverview', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'RefreshOverview')
      } else {
        console.log('published', 'RefreshOverview')
      }
    })
  })
  cron.schedule('* 3 * * *', async () => {
    stan.publish('RefreshStudyrightAssociations', null, (err, guid) => {
      if (err) {
        console.log('publish failed', 'RefreshStudyrightAssociations')
      } else {
        console.log('published', 'RefreshStudyrightAssociations')
      }
    })
  })
  const statusSub = stan.subscribe('status')
  statusSub.on('message', async (msg) => {
    const message = msg.getData().split(':')
    console.log(message)
    await updateTask(message[0], message[1])
  })
})

