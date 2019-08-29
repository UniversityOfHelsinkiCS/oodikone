const { stan } = require('./nats_connection')
const Schedule = require('../models')
const { sleep, getStudentNumberChecksum } = require('./util')

stan.on('connect', async () => {
  const taskspermin = 300
  const opts = stan.subscriptionOptions()
  opts.setManualAckMode(true)
  opts.setAckWait(5 * 60 * 1000)
  opts.setMaxInFlight(taskspermin)

  const scheduleSub = stan.subscribe('schedule', opts)
  scheduleSub.on('message', async (msg) => {
    try {
      const { task, priority } = JSON.parse(msg.getData())
      stan.publish('status', JSON.stringify({ task, status: 'SCHEDULED', priority }), (err) => {
        if (err) {
          console.log('publish failed', err)
        }
      })
      stan.publish(priority ? 'PriorityApi' : 'UpdateApi', JSON.stringify({ task }), (err) => {
        if (err) {
          console.log('publish failed', err)
        }
      })
      await sleep(60*1000)
    } catch (err) {
      console.log(err)
    }
    msg.ack()
  })
})

const publishSingle = async ({ priority, task }) => {
  const promise = new Promise((resolve) => {
    stan.publish('schedule', JSON.stringify({ task: task.task, priority }), async (err) => {
      if (err) {
        console.log('publish failed, waiting 10 seconds and republishing', err)
        await sleep(10*1000)
        resolve(await publishSingle({ priority, task }))
      } else {
        resolve(true)
      }
    })
  })
  return await promise
}

const publishAll = async (tasks, priority = false) => {
  for (const task of tasks) {
    await publishSingle({ task, priority })
  }
}

const scheduleActiveStudents = async () => {
  const tasks = [...await Schedule.find({ type: 'student', active: true }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

const scheduleAllStudents = async () => {
  const tasks = [...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

const scheduleMeta = async () => {
  await publishAll([{task: 'meta'}], true)
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
    }
  })
}

const scheduleStudentCheck = async () => {
  const tasks = [...await Schedule.find({ type: 'student', status: 'NO_STUDENT' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

const scheduleStudentsByArray = async (studentNumbers) => {
  try {
    const tasks = await Schedule.find({ type: 'student', task: { $in: studentNumbers } })
    await publishAll(tasks, true)
  } catch (e) {
    console.log(e)
  }
}

const scheduleOldestNStudents = async (amount) => {
  try {
    const tasks = [...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 }).limit(Number(amount))]
    await publishAll(tasks)
  } catch (e) {
    console.log(e)
  }
}

const rescheduleCreated = async () => {
  const tasks = [...await Schedule.find({ type: 'student', status: 'CREATED' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

const rescheduleScheduled = async () => {
  const tasks = [...await Schedule.find({ type: 'student', status: 'SCHEDULED' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

const rescheduleFetched = async () => {
  const tasks = [...await Schedule.find({ type: 'student', status: 'FETCHED' }).sort({ updatedAt: 1 })]
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

const scheduleDaily = async () => {
  const findStudentsRange = 10000
  const highestStudentNumber = (await Schedule.find({ type: 'student', status: { $in: ['DONE', 'FETCHED'] } }).sort({ task: -1 }).limit(1))[0]
  const regexResult = highestStudentNumber ? highestStudentNumber.task.match(/0(\d{7})\d/) : null
  const minstudentnumber = 1000000
  const studentNumberMid = regexResult && Number(regexResult[1]) || minstudentnumber+findStudentsRange
  const min = Math.max(studentNumberMid-findStudentsRange, minstudentnumber)
  const max = Math.min(studentNumberMid+findStudentsRange, 9999999)

  console.log({ findStudentsRange, minstudentnumber, studentNumberMid, min, max })

  const studentnumbers = []
  const activeStudents = [...await Schedule.find({ type: 'student', active: true }).sort({ updatedAt: 1 })]
  studentnumbers.push(...activeStudents.map(t => t.task))
  for (let i = min; i <= max; ++i) {
    studentnumbers.push(`0${i}${getStudentNumberChecksum(i)}`)
  }
  const oldestStudents = [...await Schedule.find({ type: 'student' }).sort({ updatedAt: 1 }).limit(10000)]
  studentnumbers.push(...oldestStudents.map(t => t.task))

  const tasks = [...new Set(studentnumbers)].map(sn => ({ task: sn }))
  console.log(tasks.length, 'tasks to schedule')
  await publishAll(tasks)
}

module.exports = {
  scheduleActiveStudents,
  scheduleStudentsByArray,
  scheduleOldestNStudents,
  scheduleMeta,
  scheduleAllStudents,
  scheduleAttainmentUpdate,
  rescheduleScheduled,
  rescheduleFetched,
  rescheduleCreated,
  scheduleDaily,
  scheduleStudentCheck
}
