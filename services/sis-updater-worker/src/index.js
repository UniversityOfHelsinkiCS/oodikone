const { stan, opts } = require('./utils/stan')
const { SIS_UPDATER_SCHEDULE_CHANNEL } = require('./config')

stan.on('error', () => {
  console.log('NATS connection failed')
})

stan.on('connect', ({ clientID }) => {
  console.log(`Connected to NATS as ${clientID}`)
  const updaterChannel = stan.subscribe(SIS_UPDATER_SCHEDULE_CHANNEL, 'sis-updater-nats.workers', opts)
  updaterChannel.on('message', msg => {
    console.log(JSON.parse(msg.getData()))
    msg.ack()
  })
})
