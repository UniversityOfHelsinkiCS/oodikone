const { knexConnection } = require('./db/connection')
const { logger } = require('./utils/logger')
const { set: redisSet } = require('./utils/redis')
const { schedule: scheduleCron } = require('./utils/cron')
const { stan } = require('./utils/stan')
const { isDev, REDIS_LAST_WEEKLY_SCHEDULE, REDIS_LAST_HOURLY_SCHEDULE } = require('./config')
const { startServer } = require('./server')
const {
  scheduleHourly,
  scheduleWeekly,
  schedulePrePurge,
  schedulePurge,
  isUpdaterActive,
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
    logger.info('Starting hourly')

    await scheduleHourly()
    await redisSet(REDIS_LAST_HOURLY_SCHEDULE, new Date())
  })

  // Saturday at 4 AM
  scheduleCron('0 4 * * 6', async () => {
    if (isDev) return
    logger.info('Starting weekly')

    await scheduleWeekly()
    await redisSet(REDIS_LAST_WEEKLY_SCHEDULE, new Date())
  })

  // Monday at 12 AM
  scheduleCron('0 12 * * MON', async () => {
    if (isDev) return
    logger.info('Starting prepurge')
    await schedulePrePurge()
  })

  // Sunday at 4 AM
  scheduleCron('0 4 * * SUN', async () => {
    // If updater is currently running, then return
    if ((await isUpdaterActive()) || isDev) return
    logger.info('Starting purge')
    await schedulePurge()
  })
})
