const stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI);
const { updateStudent, updateMeta, updateAttainmentMeta } = require('./updater/database_updater')
const { dumpDatabase } = require('./database/dump_database')
const fs = require('fs')

console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
const opts = stan.subscriptionOptions();
opts.setManualAckMode(true);
opts.setAckWait(30 * 60 * 1000); // 1min
opts.setDeliverAllAvailable()
opts.setDurableName('durable')
opts.setMaxInFlight(1)
stan.on('connect', function () {

  const sub = stan.subscribe('UpdateWrite', 'updater.workers', opts)
  const attSub = stan.subscribe('UpdateAttainmentDates', opts)
  const prioSub = stan.subscribe('PriorityWrite', 'updater.workers', opts)

  sub.on('message', async (msg) => {
    const data = JSON.parse(msg.getData())
    if (data.studentInfo) {
      await updateStudent(data, stan)
    } else {
      await updateMeta(data)
    }
    msg.ack()
    stan.publish('status', `${data.studentInfo ? data.studentInfo.studentnumber : 'meta'}:DONE`, (err) => { if (err) console.log(err) })
  })
  attSub.on('message', async (_) => {
    await updateAttainmentMeta()
    msg.ack()
  })
  prioSub.on('message', async (msg) => {
    const data = JSON.parse(msg.getData())
    await updateStudent(data, stan)
    msg.ack()
    stan.publish('status', `${data.studentInfo.studentnumber}:DONE`, (err) => { if (err) console.log(err) })
  })
})