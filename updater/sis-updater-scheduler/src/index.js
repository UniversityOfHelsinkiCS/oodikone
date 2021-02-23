const { knexConnection } = require('./db/connection')
const { set: redisSet } = require('./utils/redis')
const { schedule: scheduleCron } = require('./utils/cron')
const { stan } = require('./utils/stan')
const { isDev, REDIS_LAST_WEEKLY_SCHEDULE, REDIS_LAST_HOURLY_SCHEDULE } = require('./config')
const { startServer } = require('./server')
const {
  scheduleHourly,
  scheduleWeekly,
  schedulePurge,
  isUpdaterActive,
  hasWeeklyBeenScheduled
} = require('./scheduler')

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

  // Monday-Friday at every minute 30
  scheduleCron('30 * * * 1-5', async () => {
    // If updater is currently running, then return
    if ((await isUpdaterActive()) || isDev) return
    await scheduleHourly()
    await redisSet(REDIS_LAST_HOURLY_SCHEDULE, new Date())
  })

  // Saturday at 4 AM
  scheduleCron('0 4 * * 6', async () => {
    if (isDev) return
    await scheduleWeekly()
    await redisSet(REDIS_LAST_WEEKLY_SCHEDULE, new Date())
  })

  // Sunday at 4 AM
  scheduleCron('0 4 * * SUN', async () => {
    // If updater is currently running or weekly update
    // hasn't been scheduled properly, then return
    if ((await isUpdaterActive()) || !(await hasWeeklyBeenScheduled()) || isDev) return
    await schedulePurge()
  })
})
