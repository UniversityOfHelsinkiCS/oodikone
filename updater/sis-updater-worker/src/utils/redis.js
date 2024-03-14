const redis = require('redis')
const redisLock = require('redis-lock')
const { promisify } = require('util')

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
    func.call(client, ...params, (err, data) => {
      if (err) rej(err)
      else res(data)
    })
  })

const lock = promisify(redisLock(client))

const get = async key => await redisPromisify(client.get, key)

const set = async (key, val) => await redisPromisify(client.set, key, val)

const getObject = async key => JSON.parse(await redisPromisify(client.get, key))

const setObject = async (key, val) => await redisPromisify(client.set, key, JSON.stringify(val))

const incrby = async (key, val) => await redisPromisify(client.incrby, key, val)

const expire = async (key, val) => await redisPromisify(client.expire, key, val)

module.exports = {
  lock,
  get,
  set,
  incrby,
  expire,
  getObject,
  setObject,
}
