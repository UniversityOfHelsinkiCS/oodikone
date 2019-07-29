const stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI)
const { updateStudent, updateMeta, updateAttainmentMeta } = require('./updater/database_updater')

console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
const opts = stan.subscriptionOptions()
opts.setManualAckMode(true)
opts.setAckWait(5 * 60 * 1000) // 5min
// opts.setDeliverAllAvailable()
// opts.setDurableName('durable')
opts.setMaxInFlight(1)

stan.on('connect', function () {

  const sub = stan.subscribe('UpdateWrite', 'updater.workers', opts)
  const attSub = stan.subscribe('UpdateAttainmentDates', opts)
  const prioSub = stan.subscribe('PriorityWrite', 'updater.workers.prio', opts)

  sub.on('message', async (msg) => {
    let data = null
    try {
      data = JSON.parse(msg.getData())
      if (data.studentInfo) {
        await updateStudent(data)
      } else {
        await updateMeta(data)
      }
      stan.publish('status', `${data.studentInfo ? data.studentInfo.studentnumber : 'meta'}:DONE`, (err) => { if (err) console.log(err) })
    } catch (err) {
      let id = 'null'
      if (data) {
        id = data.studentInfo ? data.studentInfo.studentnumber : 'meta'
      }
      console.log('update failed', id, err)
    }
    msg.ack()
  })
  attSub.on('message', async (msg) => {
    try {
      await updateAttainmentMeta()
    } catch (err) {
      console.log('attainment meta update failed', err)
    }
    msg.ack()
  })
  prioSub.on('message', async (msg) => {
    let data = null
    try {
      data = JSON.parse(msg.getData())
      await updateStudent(data)
      stan.publish('status', `${data.studentInfo.studentnumber}:DONE`, (err) => { if (err) console.log(err) })
    } catch (err) {
      let id = 'null'
      if (data) {
        id = data.studentInfo ? data.studentInfo.studentnumber : 'meta'
      }
      console.log('priority student update failed', id, err)
    }
    msg.ack()
  })
})