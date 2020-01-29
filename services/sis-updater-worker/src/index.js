const { stan, opts } = require('./utils/stan')
const { dbConnections } = require('./db/connection')
const { update } = require('./updater')
const { SIS_UPDATER_SCHEDULE_CHANNEL, NATS_GROUP } = require('./config')

const msgParser = f => async msg => {
  await f(JSON.parse(msg.getData()))
  msg.ack()
}

stan.on('error', () => {
  console.log('NATS connection failed')
})

stan.on('connect', ({ clientID }) => {
  console.log(`Connected to NATS as ${clientID}`)
  dbConnections.connect()
})

dbConnections.on('error', () => {
  console.log('DB connections failed')
})

dbConnections.on('connect', () => {
  console.log('DB connections established')
  const updaterChannel = stan.subscribe(SIS_UPDATER_SCHEDULE_CHANNEL, NATS_GROUP, opts)
  updaterChannel.on('message', msgParser(update))
})
