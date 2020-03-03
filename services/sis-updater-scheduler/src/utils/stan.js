const natsStreaming = require('node-nats-streaming')
const { HOSTNAME, SIS_NATS_URI, SIS_NATS_TOKEN } = process.env

const stan = natsStreaming.connect('sis-updater-nats', HOSTNAME, {
  url: SIS_NATS_URI,
  token: SIS_NATS_TOKEN,
  maxPubAcksInflight: Infinity,
  maxReconnectAttempts: -1,
  waitOnFirstConnect: true
})

module.exports = {
  stan
}
