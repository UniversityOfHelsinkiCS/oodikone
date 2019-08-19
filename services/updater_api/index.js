var stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI)
const { getStudent, getMeta } = require('./doo_api_database_updater/updater_formatter')
const logger = require('./logger')
const moment = require('moment')


console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
var opts = stan.subscriptionOptions()
opts.setManualAckMode(true)
opts.setAckWait(10 * 60 * 1000)
// opts.setDeliverAllAvailable()
// opts.setDurableName('durable')
opts.setMaxInFlight(1)

const hasActiveEnrollment = (semesterEnrollments) => {
  if (semesterEnrollments) {
    const currentSemester = Math.floor((moment().diff(moment('1950', 'YYYY'), 'months')) / 6)
    const active = semesterEnrollments.find(e => e.semestercode === currentSemester && e.enrollmenttype === 1)
    return active ? true : false
  }
  return false
}

const fetchData = async (priority, msg) => {
  try {
    const task = JSON.parse(msg.getData())
    if (task.task === 'meta') {
      const data = await getMeta()
      stan.publish('status', JSON.stringify({ task: task.task, status: 'FETCHED' }), (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
      stan.publish(priority ? 'PriorityWrite' :'UpdateWrite', JSON.stringify({ task: task.task, data }))
    } else {
      try {
        const data = await getStudent(task.task)
        // TODO: check that data is properly structured(?)
        const active = hasActiveEnrollment(data.semesterEnrollments)
        stan.publish('status', JSON.stringify({ task: task.task, status: 'FETCHED', active }), (err) => { if (err) console.log('STATUS PUBLISH FAIELD', err) })
        stan.publish(priority ? 'PriorityWrite' :'UpdateWrite' , JSON.stringify({ task: task.task, data, active }), (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
      } catch (e) {
        if (e.name === 'NO_STUDENT') {
          stan.publish('status', JSON.stringify({ task: task.task, status: 'NO_STUDENT', active: false }), (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
          return
        } else {
          throw e
        }
      }
    }
  } catch (e) {
    console.log(e)
    logger.info('failure', { service: 'API' })
  }
}

const handleMessage = (priority) => async (msg) => {
  await fetchData(priority, msg)
  msg.ack()
}

stan.on('connect', async () => {

  const sub = stan.subscribe('UpdateApi', 'updater.workers', opts)
  const prioSub = stan.subscribe('PriorityApi', 'updater.workers.prio', opts)

  sub.on('message', handleMessage(false))
  prioSub.on('message', handleMessage(true))
})