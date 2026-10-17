import { createClient } from 'redis'
import redisLock from 'redis-lock'

import { REDIS_HOST, REDIS_PORT } from '../config'
import logger from './logger'

export const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
})

export const lock = redisLock(redisClient)

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis')
  })
  .catch(error => {
    logger.error('Failed to connect to Redis', error)
  })

redisClient.on('error', error => logger.error('Redis Client Error', { error }))
