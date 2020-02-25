const redis = require('redis')

const redisPromisify = async (func, ...params) =>
  new Promise((res, rej) => {
    func.call(client, ...params, (err, data) => {
      if (err) rej(err)
      else res(data)
    })
  })

const client = redis.createClient({
  url: process.env.REDIS_URI
})

const set = async (key, val) => await redisPromisify(client.set, key, val)

module.exports = {
  set
}
