var stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI);
const { getStudent } = require('./doo_api_database_updater/updater_formatter')


console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)
var opts = stan.subscriptionOptions();
opts.setManualAckMode(true);
opts.setAckWait(15 * 1000); // 5min
opts.setDeliverAllAvailable()
opts.setDurableName('durable')
stan.on('connect', function () {

  const sub = stan.subscribe('UpdateApi', 'updater.workers', opts)
  const prioSub = stan.subscribe('Priority_Update', 'updater.workers', opts)

  sub.on('message', async (msg) => {
    const studentnumber = msg.getData()
    // TODO: check that its a valid studentnumber and just ack it if its not
    try {
      const student = await getStudent(studentnumber)
      // TODO: check that student data is properly structured(?)
      stan.publish('UpdateWrite', JSON.stringify(student), (err, guid) => {
        if (err) {
          return err
        } else {
          msg.ack()
          console.log(studentnumber, 'read from api and published for writing', guid)
        }
      })
    } catch (e) {
      console.log(e)
    }
  });

  prioSub.on('message', async (msg) => {
    await updateStudent(msg.getData())
    msg.ack()
  });
})