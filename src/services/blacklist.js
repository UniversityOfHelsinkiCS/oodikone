const { redisClient } = require('./redis')

const REDIS_HASH_KEY = 'USERNAME_BLACKLIST'

const addUserToBlacklist = async userId => {
  console.log('ADDED BLACKLIST', userId)
  await redisClient.saddAsync([REDIS_HASH_KEY, userId])
}

const removeUserFromBlacklist = async userId => {
  console.log('REMOVED BLACKLIST', userId)
  await redisClient.sremAsync([REDIS_HASH_KEY, userId])
}

const isUserBlacklisted = async userId => {
  const isMember = await redisClient.sismemberAsync([REDIS_HASH_KEY, userId])
  console.log('IN BLACKLIST?', !!isMember, userId)
  return !!isMember
}

module.exports = { addUserToBlacklist, removeUserFromBlacklist, isUserBlacklisted }