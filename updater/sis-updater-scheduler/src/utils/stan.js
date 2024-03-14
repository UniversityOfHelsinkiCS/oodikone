const natsStreaming = require('node-nats-streaming')
const { NATS_GROUP } = require('../config')

const { HOSTNAME, SIS_NATS_URI, SIS_NATS_TOKEN } = process.env

const stan = natsStreaming.connect('sis-updater-nats', HOSTNAME, {
  url: SIS_NATS_URI,
  token: SIS_NATS_TOKEN,
  maxPubAcksInflight: Infinity,
  maxReconnectAttempts: -1,
  waitOnFirstConnect: true,
  connectTimeout: 60 * 1000 * 5,
})

const opts = stan.subscriptionOptions()
opts.setDeliverAllAvailable()
opts.setDurableName(NATS_GROUP)
opts.setManualAckMode(true)
opts.setAckWait(60 * 1000 * 15)
opts.setMaxInFlight(1)

module.exports = {
  stan,
  opts,
}
