const { knexConnection } = require('./db/connection')
const { schedule: scheduleCron } = require('./utils/cron')
const { stan } = require('./utils/stan')
const { isDev } = require('./config')
const { startServer } = require('./server')
const { scheduleMeta, scheduleStudents, scheduleHourly, scheduleWeekly } = require('./scheduler')

stan.on('error', e => {
  console.log('NATS connection failed', e)
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  console.log(`Connected to NATS as ${clientID}`)
  knexConnection.connect()
})

knexConnection.on('error', e => {
  console.log('Knex database connection failed', e)
  if (!process.env.CI) process.exit(1)
})

knexConnection.on('connect', async () => {
  console.log('Knex database connection established successfully')
  startServer()

  if (isDev) {
    await scheduleMeta()
    await scheduleStudents()
  }

  // Monday-Friday on every hour
  scheduleCron('0 * * * 1-5', async () => {
    await scheduleHourly()
  })

  // Saturday at 4 AM
  scheduleCron('0 4 * * 6', async () => {
    await scheduleWeekly()
  })
})
