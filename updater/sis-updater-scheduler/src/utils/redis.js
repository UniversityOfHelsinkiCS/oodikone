const { createClient } = require('redis')

const { REDIS_HOST, REDIS_PORT } = require('../config')
const { logger } = require('./logger')

const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
})

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis')
  })
  .catch(error => {
    logger.error('Failed to connect to Redis', error)
  })

redisClient.on('error', error => logger.error('Redis Client Error', { error }))

module.exports = { redisClient }
