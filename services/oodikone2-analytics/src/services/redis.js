const redis = require('redis')
const bluebird = require('bluebird')
const conf = require('../conf')

bluebird.promisifyAll(redis.RedisClient.prototype)

const redisClient = redis.createClient(6379, conf.REDIS)

module.exports = {
  redisClient
}