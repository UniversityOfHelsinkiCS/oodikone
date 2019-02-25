const { redisClient } = require('./redis')
const moment = require('moment')

const MAKE_REDIS_HASH_KEY = id => `BLACKLIST ${id}`

const addUserToBlacklist = async userId => {
  console.log('ADDED BLACKLIST', userId)
  await redisClient.setAsync(MAKE_REDIS_HASH_KEY(userId), moment().toISOString(false))
}

const isUserBlacklisted = async (userId, tokenCreatedAt) => {
  const blacklistTimestamp = await redisClient.getAsync(MAKE_REDIS_HASH_KEY(userId))
  const isBlacklisted = !!(tokenCreatedAt && blacklistTimestamp && moment(tokenCreatedAt) < moment(blacklistTimestamp))
  console.log('BLACKLISTED? ', {isBlacklisted, userId, tokenCreatedAt, blacklistTimestamp})
  return isBlacklisted
}

module.exports = { addUserToBlacklist, isUserBlacklisted }