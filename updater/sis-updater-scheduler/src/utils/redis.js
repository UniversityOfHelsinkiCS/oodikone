const { createClient } = require('redis')

const { logger } = require('./logger')

const redisClient = createClient({
  url: `redis:${process.env.REDIS_URI}`,
})

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis')
  })
  .catch(error => {
    logger.error('Failed to connect to Redis', error)
  })

module.exports = { redisClient }
