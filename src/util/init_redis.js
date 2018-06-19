const redis = require('redis')
const conf = require('../conf-backend')

const redisClient = redis.createClient(6379, conf.redis)
require('bluebird').promisifyAll(redis.RedisClient.prototype)

const initializeDuplicates = async () => {
  await redisClient.setAsync('duplicates', '{}')
  console.log('Initiated redis')
  process.exit()
}

initializeDuplicates()