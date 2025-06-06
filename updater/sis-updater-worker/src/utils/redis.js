import { createRequire } from 'module'
const legacyRequire = createRequire(import.meta.url)
const redisLock = legacyRequire('redis-lock')

import { createClient } from 'redis'

import { REDIS_HOST, REDIS_PORT } from '../config.js'
import logger from './logger.js'

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
