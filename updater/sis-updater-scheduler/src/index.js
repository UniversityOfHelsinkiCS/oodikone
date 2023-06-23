const { knexConnection } = require('./db/connection')
const { logger } = require('./utils/logger')
const { set: redisSet } = require('./utils/redis')
const { schedule: scheduleCron } = require('./utils/cron')
const { stan } = require('./utils/stan')
const {
  isDev,
  REDIS_LAST_WEEKLY_SCHEDULE,
  REDIS_LAST_HOURLY_SCHEDULE,
  EXIT_AFTER_IMMEDIATES,
  SCHEDULE_IMMEDIATE,
} = require('./config')
const { startServer } = require('./server')
const {
  scheduleHourly,
  scheduleWeekly,
  scheduleDaily,
  schedulePrePurge,
  schedulePurge,
  isUpdaterActive,
} = require('./scheduler')

stan.on('error', e => {
  logger.error({ message: 'NATS connection failed: ' + e, meta: e.stack })
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
  daily: scheduleDaily,
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
    await Promise.all(SCHEDULE_IMMEDIATE.map(scheduleJob))

    if (EXIT_AFTER_IMMEDIATES) {
      process.exit(0)
    }
  } catch (e) {
    logger.error({
      message: `Running immediate job failed: ${e.message}`,
      meta: e.stack,
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

  // Every day at 3 AM

  scheduleCron('0 3 * * *', async () => {
    if (isDev) return

    try {
      await scheduleDaily()
    } catch (e) {
      logger.error({
        message: 'Daily run failed: ' + e.message,
        mete: e.stack,
      })
    }
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
