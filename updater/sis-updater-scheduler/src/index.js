const {
  isDev,
  REDIS_LAST_WEEKLY_SCHEDULE,
  REDIS_LAST_HOURLY_SCHEDULE,
  EXIT_AFTER_IMMEDIATES,
  SCHEDULE_IMMEDIATE,
} = require('./config')
const { knexConnection } = require('./db/connection')
const { scheduleHourly, scheduleWeekly, schedulePrePurge, schedulePurge, isUpdaterActive } = require('./scheduler')
const { startServer } = require('./server')
const { schedule: scheduleCron } = require('./utils/cron')
const { logger } = require('./utils/logger')
const { set: redisSet } = require('./utils/redis')
const { stan } = require('./utils/stan')

stan.on('error', error => {
  logger.error({ message: `NATS connection failed: ${error}`, meta: error.stack })
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  logger.info(`Connected to NATS as ${clientID}`)
  knexConnection.connect()
})

knexConnection.on('error', error => {
  logger.error({ message: 'Knex database connection failed', meta: error.stack })
  if (!process.env.CI) process.exit(1)
})

const JOB_TYPES = {
  hourly: scheduleHourly,
  weekly: scheduleWeekly,
  prepurge: schedulePrePurge,
  purge: schedulePurge,
}

const scheduleJob = async type => {
  if (!JOB_TYPES[type]) {
    logger.info(`Cannot schedule unknown job type '${type}'.`)
    return
  }

  logger.info(`Scheduling job type '${type}'.`)

  await JOB_TYPES[type]()

  logger.info(`Job '${type}' finished.`)
}

const handleImmediates = async () => {
  try {
    logger.info('Handling immediates')
    await Promise.all(SCHEDULE_IMMEDIATE.map(scheduleJob))

    if (EXIT_AFTER_IMMEDIATES) {
      process.exit(0)
    }
  } catch (error) {
    logger.error({
      message: `Running immediate job failed: ${error.message}`,
      meta: error.stack,
    })

    if (EXIT_AFTER_IMMEDIATES) {
      process.exit(1)
    }
  }
}

knexConnection.on('connect', async () => {
  logger.info('Knex database connection established successfully')
  startServer()
  await handleImmediates()

  // Monday-Friday at every minute 30
  scheduleCron('30 * * * 1-5', async () => {
    // If updater is currently running, then return
    if ((await isUpdaterActive()) || isDev) return

    try {
      logger.info('Starting hourly')
      await scheduleHourly()
    } catch (error) {
      logger.error({
        message: `Hourly run failed: ${error.message}`,
        meta: error.stack,
      })
    }

    await redisSet(REDIS_LAST_HOURLY_SCHEDULE, new Date())
  })

  // Saturday at 4 AM
  scheduleCron('0 4 * * 6', async () => {
    if (isDev) return
    logger.info('Starting weekly')

    try {
      await scheduleWeekly()
    } catch (error) {
      logger.error({
        message: `Weekly run failed: ${error.message}`,
        meta: error.stack,
      })
    }

    await redisSet(REDIS_LAST_WEEKLY_SCHEDULE, new Date())
  })

  // Monday at 12 AM
  scheduleCron('0 12 * * MON', async () => {
    if (isDev) return
    logger.info('Starting prepurge')

    try {
      await schedulePrePurge()
    } catch (error) {
      logger.error({
        message: `Prepurge failed: ${error.message}`,
        meta: error.stack,
      })
    }
  })

  // Sunday at 4 AM
  scheduleCron('0 4 * * SUN', async () => {
    // If updater is currently running, then return
    if ((await isUpdaterActive()) || isDev) return
    logger.info('Starting purge')

    try {
      await schedulePurge()
    } catch (error) {
      logger.error({
        message: `Purge failed: ${error.message}`,
        meta: error.stack,
      })
    }
  })
})
