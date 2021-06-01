const axios = require('axios')
const { redisClient } = require('../redis')
const { USERSERVICE_URL } = require('../../conf-backend')

const userServiceClient = axios.create({
  baseURL: USERSERVICE_URL,
  headers: { secret: process.env.USERSERVICE_SECRET }
})

const getRedisCDS = async REDIS_KEY => {
  const raw = await redisClient.getAsync(REDIS_KEY)
  return raw && JSON.parse(raw)
}

const saveToRedis = async (data, REDIS_KEY, expire = false) => {
  await redisClient.setAsync(REDIS_KEY, JSON.stringify(data))
  if (expire) {
    // expire redis keys that are created daily after 24 hours
    redisClient.expireat(REDIS_KEY, parseInt(new Date().valueOf() / 1000) + 86400)
  }
}

module.exports = {
  getRedisCDS,
  saveToRedis,
  userServiceClient
}
