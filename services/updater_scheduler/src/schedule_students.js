const { stan } = require('./nats_connection')
const Schedule = require('../models')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const publish = async (tasks, priority = false) => {
  let rampup = 300
  for (const task of tasks) {
    if (rampup > 1) {
      rampup = rampup - 1
    }
    stan.publish(priority ? 'UpdateApi' : 'PriorityApi', task.task, (err, guid) => {
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
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array
}
const scheduleActiveStudents = async () => {
  const tasks = [...shuffleArray(await Schedule.find({ type: 'student', active: true }))]
  console.log(tasks.length, 'tasks to schedule')
  publish(tasks)
}
const scheduleAllStudentsAndMeta = async () => {

  const tasks = [{ task: 'meta', type: 'other', active: 'false' }, ...shuffleArray(await Schedule.find({ type: 'student' }))]
  console.log(tasks.length, 'tasks to schedule')
  publish(tasks)
}

const scheduleStudentsByArray = async (studentNumbers) => {
  try {
    const tasks = await Schedule.find({ type: 'student', task: { $in: studentNumbers } })
    publish(tasks, true)
  } catch (e) {
    return e
  }
  return 'scheduled'
}
module.exports = { scheduleActiveStudents, scheduleAllStudentsAndMeta, scheduleStudentsByArray }