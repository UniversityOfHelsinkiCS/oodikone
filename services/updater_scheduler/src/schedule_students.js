const { stan } = require('./nats_connection')
const Schedule = require('../models')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const scheduleActiveStudents = async () => {
  const tasks = [...(await Schedule.find({ type: 'student', active: true }))]
  console.log(tasks.length, 'tasks to schedule')
  for (const task of tasks) {
    stan.publish('UpdateApi', task.task, (err, guid) => {
      console.log(guid)
      if (err) {
        console.log('publish failed', err)
      }
    })
    stan.publish('status', `${task.task}:SCHEDULED`, (err) => {
      if (err) {
        console.log('publish failed')
      }
    })
    await sleep(15)
  }
}
const scheduleAllStudentsAndMeta = async () => {

  const tasks = ['meta', ...(await Schedule.find({ type: 'student' }))]
  console.log(await Schedule.find())
  console.log(tasks.length, 'tasks to schedule')
  for (const task of tasks) {
    stan.publish('UpdateApi', task.task, (err, guid) => {
      console.log(guid)
      if (err) {
        console.log('publish failed')
      }
    })
    stan.publish('status', `${task.task}:SCHEDULED`, (err) => {
      if (err) {
        console.log('publish failed')
      }
    })
    await sleep(15)
  }
}
module.exports = { scheduleActiveStudents, scheduleAllStudentsAndMeta }