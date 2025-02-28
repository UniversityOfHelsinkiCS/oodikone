const { createClient } = require('redis')
const redisLock = require('redis-lock')

const { REDIS_HOST, REDIS_PORT } = require('../config')
const { logger } = require('./logger')

const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
})

const lock = redisLock(redisClient)

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis')
  })
  .catch(error => {
    logger.error('Failed to connect to Redis', error)
  })

redisClient.on('error', error => logger.error('Redis Client Error', { error }))

module.exports = {
  redisClient,
  lock,
}
