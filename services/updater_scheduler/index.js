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
  await testpopulate()
  cron.schedule('* * * * *', async () => {
    const tasks = await Schedule.find({ type: 'student' }).limit(5).sort({ 'updatedAt': 1 })
    for (const task of tasks) {
      stan.publish('UpdateApi', task.task, (err, guid) => {
        if (err) {
          console.log('publish failed')
        } else {
          console.log('published', task.task)
        }
      })
      stan.publish('status', `${task.tast}:SCHEDULED`, (err) => {
        if(err) {
          console.log('publish failed')
        }
      })
    }
  })
  const statusSub = stan.subscribe('status')
  statusSub.on('message', (msg) => {
    console.log('ayyylamo')
  })
})

