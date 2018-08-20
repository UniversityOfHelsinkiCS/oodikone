const redis = require('redis')
const conf = require('../conf-backend.js')

let redisClient // eslint disable-line

if (process.env.NODE_ENV !== 'test') {
  redisClient = redis.createClient(6379, conf.redis)
  require('bluebird').promisifyAll(redis.RedisClient.prototype)
}
module.exports = {
  redisClient
}