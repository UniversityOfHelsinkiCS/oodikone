const { knexConnection } = require('./db/connection')
const { logger } = require('./utils/logger')
const { set: redisSet } = require('./utils/redis')
const { schedule: scheduleCron } = require('./utils/cron')
const { stan } = require('./utils/stan')
const { isDev, REDIS_LAST_WEEKLY_SCHEDULE, REDIS_LAST_HOURLY_SCHEDULE } = require('./config')
const { startServer } = require('./server')
const { scheduleHourly, scheduleWeekly, schedulePrePurge, schedulePurge, isUpdaterActive } = require('./scheduler')

stan.on('error', e => {
  logger.error({ message: 'NATS connection failed', meta: e.stack })
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  logger.info(`Connected to NATS as ${clientID}`)
  knexConnection.connect()
})

knexConnection.on('error', e => {
  logger.error({ message: 'Knex database connection failed', meta: e.stack })
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
    logger.error({
      message: `Cannot schedule unknown job type '${type}'.`,
      job: type,
    })

    return
  }

  logger.info(`Scheduling job type '${type}'.`)

  await JOB_TYPES[type]()

  logger.info(`Job '${type}' finished.`)
}

const runImmediates = async () => {
  const jobs = (process.env.SCHEDULE_IMMEDIATE || 'none').split(',')
  await Promise.all(jobs.map(scheduleJob))
}

const handleImmediates = async () => {
  const exit = process.env.EXIT_AFTER_IMMEDIATES === 'yes'

  try {
    await runImmediates()

    if (exit) {
      process.exit(0)
    }
  } catch (e) {
    logger.error({
      message: `Running immediate job failed: ${e.message}`,
      meta: e.stack,
    })

    if (exit) {
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
    logger.info('Starting hourly')

    try {
      await scheduleHourly()
    } catch (e) {
      logger.error({
        message: 'Hourly run failed: ' + e.message,
        meta: e.stack,
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
    } catch (e) {
      logger.error({
        message: 'Weekly run failed: ' + e.message,
        meta: e.stack,
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
    } catch (e) {
      logger.error({
        message: 'Prepurge failed: ' + e.message,
        meta: e.stack,
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
    } catch (e) {
      logger.error({
        message: 'Purge failed: ' + e.message,
        meta: e.stack,
      })
    }
  })
})
