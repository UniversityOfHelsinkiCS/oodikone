const natsStreaming = require('node-nats-streaming')
const { NATS_GROUP } = require('../config')
const { HOSTNAME, SIS_NATS_URI, SIS_NATS_TOKEN } = process.env

const stan = natsStreaming.connect('sis-updater-nats', HOSTNAME, {
  url: SIS_NATS_URI,
  token: SIS_NATS_TOKEN
})

const opts = stan.subscriptionOptions()
opts.setDeliverAllAvailable()
opts.setDurableName(NATS_GROUP)
opts.setMaxInFlight(1)

module.exports = {
  stan,
  opts
}
