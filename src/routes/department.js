const router = require('express').Router()
const Department = require('../services/departments')
const conf = require('../conf-backend')

router.get('/api/departmentsuccess', async function (req, res) {
  const startDate = req.query.date ? req.query.date.split('.').join('-') : '2005-08-01'
  const months = 13

  const redis = require('redis')
  require('bluebird').promisifyAll(redis.RedisClient.prototype)
  const client = redis.createClient(6379, conf.redis)
  const env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development'

  const key = `department-statistics-${startDate}-${months}-${env}`
  const timeToLive = env === 'test' ? 60 * 60 : 60 * 60 * 24 * 7 // one hour or one week

  try {
    let results = await client.getAsync(key)
    if (results === null) {
      results = await Department.averagesInMonths(startDate, months)
      await client.setAsync(key, JSON.stringify(results), 'EX', timeToLive)
    } else {
      results = JSON.parse(results)
    }

    res.json(results)
  } catch (e) {
    console.log(e)
  }

})

module.exports = router
