const {
  NATS_GROUP,
  REDIS_TOTAL_META_KEY,
  REDIS_TOTAL_STUDENTS_KEY,
  REDIS_TOTAL_META_DONE_KEY,
  REDIS_TOTAL_STUDENTS_DONE_KEY,
  REDIS_LATEST_MESSAGE_RECEIVED,
} = require('./config')
const { dbConnections } = require('./db/connection')
const { loadMapsOnDemand } = require('./updater/shared')
const { logger } = require('./utils/logger')
const { redisClient } = require('./utils/redis')
const { stan, opts } = require('./utils/stan')
require('./worker')

const handleMessage = messageHandler => async msg => {
  let data = null

  try {
    data = JSON.parse(msg.getData())
  } catch (error) {
    logger.error({
      message: 'Failed to parse message',
      meta: error.stack,
    })
  }

  try {
    if (data.type) logger.info({ message: `Starting to handle message of type ${data.type}` })
    await messageHandler(data)

    if (data.id) {
      logger.info({ message: `Completion Ack ${data.id} (Success)` })
      stan.publish(`SIS_COMPLETED_CHANNEL-${data.id}`, JSON.stringify({ id: data.id, success: true }))
    }
  } catch (error) {
    if (data.id) {
      logger.info({ message: `Completion Ack ${data.id} (Failure)` })
      stan.publish(
        `SIS_COMPLETED_CHANNEL-${data.id}`,
        JSON.stringify({ id: data.id, success: false, message: error.message })
      )
    }

    logger.error('Failed handling message', { error })
  } finally {
    try {
      msg.ack()
      await redisClient.set(REDIS_LATEST_MESSAGE_RECEIVED, new Date().toISOString())
    } catch (error) {
      logger.error({ message: 'Failed acking message', meta: error.stack })
      if (error.name === 'NatsError' && !process.env.CI) process.exit(1)
    }
  }
}

const resetStatusToZero = async (...redisKeys) => {
  for (const key of redisKeys) {
    await redisClient.set(key, 0)
  }
}

const handleInfoMessage = async infoMsg => {
  if (infoMsg.message === 'ABORT') {
    logger.info({ message: 'Starting to abort scheduled messages' })
    await resetStatusToZero(
      REDIS_TOTAL_META_KEY,
      REDIS_TOTAL_META_DONE_KEY,
      REDIS_TOTAL_STUDENTS_KEY,
      REDIS_TOTAL_STUDENTS_DONE_KEY
    )
  }
  if (infoMsg.message === 'RELOAD_REDIS') {
    logger.info({ message: 'Starting to reload redis cache' })
    await loadMapsOnDemand()
  }
}

stan.on('error', error => {
  logger.error({ message: 'NATS connection failed', meta: error })
  if (!process.env.CI) process.exit(1)
})

stan.on('connect', ({ clientID }) => {
  logger.info(`Connected to NATS as ${clientID}`)
  dbConnections.connect()
})

dbConnections.on('error', () => {
  logger.error('DB connections failed')
  if (!process.env.CI) process.exit(1)
})

dbConnections.on('connect', async () => {
  logger.info('DB connections established')

  const infoChannel = stan.subscribe('SIS_INFO_CHANNEL', NATS_GROUP, opts)
  infoChannel.on('message', handleMessage(handleInfoMessage))
})
