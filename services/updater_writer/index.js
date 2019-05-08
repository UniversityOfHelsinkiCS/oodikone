const stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI);
const { updateStudent } = require('./updater/database_updater')
const fs = require('fs')

console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
const opts = stan.subscriptionOptions();
opts.setManualAckMode(true);
opts.setAckWait(15 * 1000); // 5min
opts.setDeliverAllAvailable()
opts.setDurableName('durable')
opts.setMaxInFlight(1)
stan.on('connect', function () {

  const sub = stan.subscribe('UpdateWrite', 'updater.workers', opts)

  sub.on('message', async (msg) => {
    const data = JSON.parse(msg.getData())
    if (data.studentInfo) {
      fs.writeFileSync(`./updater/test_assets/${data.studentInfo.studentnumber}.json`, JSON.stringify(data)) 
      console.log('student got')
    } else {
      fs.writeFileSync(`./updater/test_assets/meta.json`, JSON.stringify(data))
      console.log('meta got')
    }
    // await updateStudent(data)
    msg.ack()
  });

})