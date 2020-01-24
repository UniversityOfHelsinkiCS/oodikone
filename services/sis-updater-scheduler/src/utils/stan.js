const natsStreaming = require('node-nats-streaming')
const { HOSTNAME, SIS_NATS_URI, SIS_NATS_TOKEN } = process.env

const stan = natsStreaming.connect('sis-updater-nats', HOSTNAME, {
  url: SIS_NATS_URI,
  token: SIS_NATS_TOKEN
})

const opts = stan.subscriptionOptions()
opts.setManualAckMode(true)
opts.setAckWait(60 * 1000 * 15)
opts.setMaxInFlight(5)

module.exports = {
  stan,
  opts
}
