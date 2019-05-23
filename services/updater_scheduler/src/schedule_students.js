const { stan } = require('./nats_connection')
const Schedule = require('../models')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const publish  = async (tasks) => {
  let rampup = 300 
  for (const task of tasks) {
    if (rampup > 1) {
      rampup = rampup - 1
    }
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
    await sleep(15 * rampup)
  }
}
const scheduleActiveStudents = async () => {
  const tasks = [...(await Schedule.find({ type: 'student', active: true }))]
  console.log(tasks.length, 'tasks to schedule')
  publish(tasks)
}
const scheduleAllStudentsAndMeta = async () => {

  const tasks = ['meta', ...(await Schedule.find({ type: 'student' }))]
  console.log(tasks.length, 'tasks to schedule')
  publish(tasks)
}
module.exports = { scheduleActiveStudents, scheduleAllStudentsAndMeta }