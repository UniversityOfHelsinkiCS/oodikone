const { stan } = require('./nats_connection')
const Schedule = require('../models')
const { sleep } = require('./util')


stan.on('connect', async () => {
  const taskspermin = 200
  const opts = stan.subscriptionOptions()
  opts.setManualAckMode(true)
  opts.setAckWait(5 * 60 * 1000)
  opts.setMaxInFlight(taskspermin)

  const scheduleSub = stan.subscribe('schedule', opts)
  scheduleSub.on('message', async (msg) => {
    try {
      const { task, priority } = JSON.parse(msg.getData())
      stan.publish(priority ? 'PriorityApi' : 'UpdateApi', JSON.stringify({ task }), (err) => {
        if (err) {
          console.log('publish failed', err)
        }
      })
      stan.publish('status', JSON.stringify({ task: task.task, status: 'SCHEDULED' }), (err) => {
        if (err) {
          console.log('publish failed')
        }
      })
      await sleep(60*1000)
    } catch (err) {
      console.log(err)
    }
    msg.ack()
  })
})

const publish = async (tasks, priority = false) => {
  for (const task of tasks) {
    stan.publish('schedule', JSON.stringify({ task: task.task, priority }), (err) => {
      if (err) {
        console.log('publish failed', err)
      }
    })
  }
}

const scheduleActiveStudents = async () => {
  const tasks = [...await Schedule.find({ type: 'student', active: true }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publish(tasks)
}

const scheduleAllStudents = async () => {
  const tasks = [...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publish(tasks)
}

const scheduleMeta = async () => {
  console.log('scheduling meta')
  await publish([{task: 'meta', type: 'other', active: 'false'}])
}

const scheduleAllStudentsAndMeta = async () => {
  await scheduleMeta()
  await scheduleAllStudents()
}

const scheduleStudentsByArray = async (studentNumbers) => {
  try {
    const tasks = await Schedule.find({ type: 'student', task: { $in: studentNumbers } })
    await publish(tasks, true)
  } catch (e) {
    console.log(e)
  }
}

const scheduleOldestNStudents = async (amount) => {
  try {
    const tasks = [...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 }).limit(Number(amount))]
    await publish(tasks, true)
  } catch (e) {
    console.log(e)
  }
}

const scheduleAttainmentUpdate = async () => {
  stan.publish('status', JSON.stringify({ task: 'attainment', status: 'SCHEDULED' }), (err) => {
    if (err) {
      console.log('publish failed')
    }
  })
  stan.publish('UpdateAttainmentDates', null, (err) => {
    if (err) {
      console.log('publish failed', 'UpdateAttainmentDates')
    } else {
      console.log('published', 'UpdateAttainmentDates')
    }
  })
}

const rescheduleScheduled = async () => {
  const tasks = [...await Schedule.find({ type: 'student', status: 'SCHEDULED' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publish(tasks)
}

const rescheduleFetched = async () => {
  const tasks = [...await Schedule.find({ type: 'student', status: 'FETCHED' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publish(tasks)
}

module.exports = {
  scheduleActiveStudents,
  scheduleAllStudentsAndMeta,
  scheduleStudentsByArray,
  scheduleOldestNStudents,
  scheduleMeta,
  scheduleAllStudents,
  scheduleAttainmentUpdate,
  rescheduleScheduled,
  rescheduleFetched
}