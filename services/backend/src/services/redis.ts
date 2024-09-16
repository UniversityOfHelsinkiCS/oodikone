import { createClient } from 'redis'

import { redis as redisHost } from '../config'
import logger from '../util/logger'

export const redisClient = createClient({
  socket: {
    host: redisHost,
  },
})

redisClient
  .connect()
  .then(() => {
    logger.info('Connected to Redis')
  })
  .catch(error => {
    logger.error('Failed to connect to Redis', error)
  })

redisClient.on('error', error => logger.error('Redis Client Error', error))
