const redis = require('redis')
const bluebird = require('bluebird')
const conf = require('../conf-backend.js')

bluebird.promisifyAll(redis.RedisClient.prototype)

const redisClient = redis.createClient(6379, conf.redis)

module.exports = {
  redisClient
}