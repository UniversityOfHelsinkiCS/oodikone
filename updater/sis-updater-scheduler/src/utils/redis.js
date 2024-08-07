const redis = require('redis')

const redisRetry = ({ attempt, error }) => {
  if (attempt > 100) {
    throw new Error('Lost connection to Redis...', error)
  }

  return Math.min(attempt * 100, 5000)
}

const client = redis.createClient({
  url: process.env.REDIS_URI,
  retry_strategy: redisRetry,
})

const redisPromisify = async (func, ...params) =>
  new Promise((res, rej) => {
    func.call(client, ...params, (error, data) => {
      if (error) {
        rej(error)
      } else {
        res(data)
      }
    })
  })

const set = async (key, val) => await redisPromisify(client.set, key, val)

const get = async key => await redisPromisify(client.get, key)

const incrby = async (key, val) => await redisPromisify(client.incrby, key, val)

module.exports = {
  set,
  get,
  incrby,
}
