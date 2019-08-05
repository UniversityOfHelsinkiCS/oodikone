var stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI)
const { getStudent, getMeta } = require('./doo_api_database_updater/updater_formatter')
const logger = require('./logger')


console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
var opts = stan.subscriptionOptions()
opts.setManualAckMode(true)
opts.setAckWait(10 * 60 * 1000)
// opts.setDeliverAllAvailable()
// opts.setDurableName('durable')
opts.setMaxInFlight(1)

const fetchData = async (priority, msg) => {
  try {
    let data = ''
    const task = JSON.parse(msg.getData())
    if (task.task === 'meta') {
      data = await getMeta()
      stan.publish('UpdateWrite', JSON.stringify({ task: task.task, data }))
      stan.publish('status', JSON.stringify({ task: task.task, status: 'FETCHED' }), (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
    } else {
      try {
        data = await getStudent(task.task)
      } catch (e) {
        if (e.name === 'NO_STUDENT') {
          stan.publish('status', JSON.stringify({ task: task.task, status: 'NO_STUDENT' }), (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
          return
        } else {
          throw e
        }
      }
      // TODO: check that data is properly structured(?)
      stan.publish(priority ? 'PriorityWrite' :'UpdateWrite' , JSON.stringify({ task: task.task, data }), (err) => { if (err) console.log( 'STATUS PUBLISH FAILED', err) })
      stan.publish('status', JSON.stringify({ task: task.task, status: 'FETCHED' }), (err) => { if (err) console.log('STATUS PUBLISH FAIELD', err) })
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