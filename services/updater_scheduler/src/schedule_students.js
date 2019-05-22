const { stan } = require('./nats_connection')
const Schedule = require('../models')

const scheduleActiveStudents = async () => {
  console.log(await Schedule.find())
  const tasks = [...(await Schedule.find({ type: 'student', active: true }))]
  for (const task of tasks) {
    stan.publish('UpdateApi', task.task, (err, guid) => {
      if (err) {
        console.log('publish failed', err)
      }
    })
    stan.publish('status', `${task.task}:SCHEDULED`, (err) => {
      if (err) {
        console.log('publish failed')
      }
    })
  }
}
const scheduleAllStudentsAndMeta = async () => {

  const tasks = ['meta', ...(await Schedule.find({ type: 'student' }))]
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
}
module.exports = { scheduleActiveStudents, scheduleAllStudentsAndMeta }