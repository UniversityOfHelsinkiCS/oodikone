const redis = require('redis')
const redisLock = require('redis-lock')
const { promisify } = require('util')

const client = redis.createClient({
  url: process.env.REDIS_URI
})

const lock = promisify(redisLock(client))

module.exports = {
  lock
}
