const { stan } = require('./nats_connection')
const Schedule = require('../models')
const { sleep } = require('./util')

const publish = async (tasks, priority = false) => {
  const taskspermin = 200
  for (const [index, task] of tasks.entries()) {
    stan.publish(priority ? 'PriorityApi' : 'UpdateApi', JSON.stringify({ task: task.task }), (err) => {
      if (err) {
        console.log('publish failed', err)
      }
    })
    stan.publish('status', JSON.stringify({ task: task.task, status: 'SCHEDULED' }), (err) => {
      if (err) {
        console.log('publish failed')
      }
    })
    if ((index+1)%taskspermin === 0) {
      await sleep(60*1000)
    }
  }
}

const scheduleActiveStudents = async () => {
  const tasks = [...await Schedule.find({ type: 'student', active: true }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publish(tasks)
}
const scheduleAllStudentsAndMeta = async () => {

  const tasks = [{ task: 'meta', type: 'other', active: 'false' }, ...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publish(tasks)
}

const scheduleMeta = async () => {
  console.log('scheduling meta')
  await publish([{task: 'meta', type: 'other', active: 'false'}])
}

const scheduleStudentsByArray = async (studentNumbers) => {
  try {
    const tasks = await Schedule.find({ type: 'student', task: { $in: studentNumbers } })
    await publish(tasks, true)
  } catch (e) {
    return e
  }
  return 'scheduled'
}

const scheduleOldestNStudents = async (amount) => {
  try {
    const tasks = [...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 }).limit(Number(amount))]
    await publish(tasks, true)
  } catch (e) {
    return e
  }
  return 'scheduled'
}

module.exports = { scheduleActiveStudents, scheduleAllStudentsAndMeta, scheduleStudentsByArray, scheduleOldestNStudents, scheduleMeta }