const bluebird = require('bluebird')
const redis = require('redis')

const conf = require('../config')
const logger = require('../util/logger')

bluebird.promisifyAll(redis.RedisClient.prototype)

const redisClient = redis.createClient(6379, conf.redis)

redisClient.on('error', error => logger.error('Redis Client Error', error))

module.exports = {
  redisClient,
}
