const stan = require('node-nats-streaming').connect('updaterNATS', process.env.HOSTNAME, process.env.NATS_URI)

console.log(`STARTING WITH ${process.env.HOSTNAME} as id`)

const opts = stan.subscriptionOptions()
opts.setManualAckMode(true)
opts.setAckWait(10 * 60 * 1000)
opts.setMaxInFlight(1)

module.exports = {
  stan,
  opts
}
