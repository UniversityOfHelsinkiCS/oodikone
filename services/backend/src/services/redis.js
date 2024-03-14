const redis = require('redis')
const bluebird = require('bluebird')
const conf = require('../conf-backend')
const logger = require('../util/logger')

bluebird.promisifyAll(redis.RedisClient.prototype)

const redisClient = redis.createClient(6379, conf.redis)

redisClient.on('error', err => logger.error('Redis Client Error', err))

module.exports = {
  redisClient,
}
