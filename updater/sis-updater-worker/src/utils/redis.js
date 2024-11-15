const { createClient } = require('redis')
const redisLock = require('redis-lock')

const { logger } = require('./logger')

const redisClient = createClient({
  url: `redis:${process.env.REDIS_URI}`,
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
