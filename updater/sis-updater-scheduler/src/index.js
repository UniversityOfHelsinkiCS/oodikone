const {
  isDev,
  isStaging,
  REDIS_LAST_WEEKLY_SCHEDULE,
  REDIS_LAST_HOURLY_SCHEDULE,
  EXIT_AFTER_IMMEDIATES,
  SCHEDULE_IMMEDIATE,
} = require('./config')
const { knexConnection } = require('./db/connection')
const { queue } = require('./queue')
const { scheduleHourly, scheduleWeekly, schedulePrePurge, schedulePurge, isUpdaterActive } = require('./scheduler')
const { startServer } = require('./server')
const { schedule: scheduleCron } = require('./utils/cron')
const { logger } = require('./utils/logger')
const { redisClient } = require('./utils/redis')

knexConnection.connect().catch(error => {
  logger.error('Knex database connection failed', { error })
})

knexConnection.on('error', error => {
  logger.error({ message: 'Knex database connection failed', meta: error.stack })
  process.exit(1)
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

  if (isStaging) {
    logger.info(`Skipping scheduling update job in staging: ${type}`)
    return
  }

  logger.info(`Scheduling job type '${type}'.`)

  await JOB_TYPES[type]()

  logger.info(`Job '${type}' finished.`)
}

/** Wait for all jobs to finish eg. queue to be empty and then resolve the promise */
const waitForAllJobs = async () =>
  new Promise((resolve, reject) => {
    setInterval(async () => {
      const jobs = await queue.getJobCounts('active', 'waiting', 'failed')
      if (jobs.failed > 0) {
        logger.error('Failed job found.')
        clearTimeout()
        return reject()
      }

      if (jobs.active === 0 && jobs.waiting === 0) {
        logger.info('All jobs finished.')
        clearTimeout()
        return resolve()
      }
      logger.info('Jobs still in queue:', jobs)
    }, 5000)
  })

const handleImmediates = async () => {
  try {
    logger.info('Handling immediates')
    await Promise.all(SCHEDULE_IMMEDIATE.map(scheduleJob))

    if (EXIT_AFTER_IMMEDIATES) {
      await waitForAllJobs()
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

  // Every hour at the 30th minute
  scheduleCron('30 * * * *', async () => {
    // If updater is currently running, then return
    if ((await isUpdaterActive()) || isDev) return

    const now = new Date()
    const dayOfWeek = now.getDay()
    const hour = now.getHours()

    // Skip hourly updates on Saturday between 4:30 AM and 11:30 AM because of weekly updates
    if (dayOfWeek === 6 && hour >= 4 && hour <= 11) {
      return
    }

    try {
      logger.info('Starting hourly')
      await scheduleHourly()
    } catch (error) {
      logger.error({
        message: `Hourly run failed: ${error.message}`,
        meta: error.stack,
      })
    }

    await redisClient.set(REDIS_LAST_HOURLY_SCHEDULE, new Date().toISOString())
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

    await redisClient.set(REDIS_LAST_WEEKLY_SCHEDULE, new Date().toISOString())
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
