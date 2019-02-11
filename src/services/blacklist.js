const { redisClient } = require('./redis')

const REDIS_HASH_KEY = 'USER_TOKEN_BLACKLIST'

const addTokenToBlacklist = async token => {
  await redisClient.saddAsync([REDIS_HASH_KEY, token])
}

const removeTokenFromBlacklist = async token => {
  await redisClient.sremAsync([REDIS_HASH_KEY, token])
}

const isTokenBlacklisted = async token => {
  const isMember = await redisClient.sismemberAsync([REDIS_HASH_KEY, token])
  return !!isMember
}

module.exports = { addTokenToBlacklist, removeTokenFromBlacklist, isTokenBlacklisted }