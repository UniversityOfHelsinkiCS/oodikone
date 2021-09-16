const { redisClient } = require('./redis')
const moment = require('moment')
const logger = require('../util/logger')

const MAKE_REDIS_HASH_KEY = id => `BLACKLIST ${id}`

const addUserToBlacklist = async userId => {
  logger.info(`user ${userId} added to token blacklist`)
  await redisClient.setAsync(MAKE_REDIS_HASH_KEY(userId), moment().toISOString(false))
}

const isUserBlacklisted = async (userId, tokenCreatedAt) => {
  const isBlacklisted = async () => {
    const blacklistTimestamp = await redisClient.getAsync(MAKE_REDIS_HASH_KEY(userId))
    return tokenCreatedAt && blacklistTimestamp && moment(tokenCreatedAt) < moment(blacklistTimestamp)
  }

  const timer = () => new Promise(resolve => setTimeout(() => resolve(true), 5000))
  return Promise.race([isBlacklisted(), timer()])
}

module.exports = { addUserToBlacklist, isUserBlacklisted }
