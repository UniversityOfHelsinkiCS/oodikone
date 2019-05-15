const stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI);
const { updateStudent, updateMeta } = require('./updater/database_updater')
const fs = require('fs')

console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
const opts = stan.subscriptionOptions();
opts.setManualAckMode(true);
opts.setAckWait(1 * 60 * 1000); // 1min
opts.setDeliverAllAvailable()
opts.setDurableName('durable')
opts.setMaxInFlight(1)
stan.on('connect', function () {

  const sub = stan.subscribe('UpdateWrite', 'updater.workers', opts)

  sub.on('message', async (msg) => {
    const data = JSON.parse(msg.getData())
    if (data.studentInfo) {
      await updateStudent(data)
    } else {
      await updateMeta(data)
    }
    msg.ack()
    stan.publish('status', `${data.studentInfo ? data.studentInfo.studentnumber : 'meta'}:DONE`, (err) => { if (err) console.log(err) })
  });

})