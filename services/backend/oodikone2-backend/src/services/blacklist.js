const { redisClient } = require('./redis')
const moment = require('moment')

const MAKE_REDIS_HASH_KEY = id => `BLACKLIST ${id}`

const addUserToBlacklist = async userId => {
  console.log('ADDED BLACKLIST', userId)
  await redisClient.setAsync(MAKE_REDIS_HASH_KEY(userId), moment().toISOString(false))
}

const isUserBlacklisted = async (userId, tokenCreatedAt) => {
  const isBlacklisted = async () => {
    const blacklistTimestamp = await redisClient.getAsync(MAKE_REDIS_HASH_KEY(userId))
    const status = !!(tokenCreatedAt && blacklistTimestamp && moment(tokenCreatedAt) < moment(blacklistTimestamp))
    return status
  }
  const timer = () => new Promise(resolve => setTimeout(() => resolve(true), 5000))
  return Promise.race([isBlacklisted(), timer()])
}

module.exports = { addUserToBlacklist, isUserBlacklisted }
