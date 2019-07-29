const { stan } = require('./nats_connection')
const Schedule = require('../models')
const { sleep } = require('./util')

const publish = async (tasks, priority = false) => {
  let rampup = 300
  for (const task of tasks) {
    if (rampup > 1) {
      rampup = rampup - 1
    }
    stan.publish(priority ? 'PriorityApi' : 'UpdateApi', task.task, (err, guid) => {
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
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
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
module.exports = { scheduleActiveStudents, scheduleAllStudentsAndMeta, scheduleStudentsByArray, scheduleMeta }