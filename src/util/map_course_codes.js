const redis = require('redis')
const Course = require('../services/courses')
const conf = require('../conf-backend')

const redisClient = redis.createClient(6379, conf.redis)
require('bluebird').promisifyAll(redis.RedisClient.prototype)

// two tables of prefixes, for example new prefixes of  Matlu courses:
// ['CSM', 'DATA', 'FYS', 'MAT', 'TKT', 'KEK'] 
// and old prefixes
// ['5', '7']

const mapCourseCodes = async (newPrefixes, oldPrefixes) => {
  const all = await redisClient.getAsync('duplicates')
  if (!all) {
    await redisClient.setAsync('duplicates', '{}')
  }

  const res = await Course.findDuplicates(newPrefixes, oldPrefixes)
  const mappedCodes = res ? res[0] : []
  const formattedCodes = mappedCodes.map(r => { return { [r.code1]: r.code2 } })
  await updateRedis(formattedCodes)
}

const redisGetAndSet = async (code1, code2) => {
  const res = await redisClient.getAsync('duplicates')
  const all = JSON.parse(res)
  if (all[code1]) {
    if (!all[code1].includes(code2)) {
      all[code1].push(code2)
    }
  } else {
    all[code1] = [code2]
  }
  await redisClient.setAsync('duplicates', JSON.stringify(all))
}

const updateRedis = async (codes) => {

  for (const i in codes) {
    let code = codes[i]
    const newCode = Object.keys(code)[0]
    const oldCode = code[newCode]
    await redisGetAndSet(newCode, oldCode)
    await redisGetAndSet(oldCode, newCode)
  }
}

mapCourseCodes(['CSM', 'TKT', 'MAT', 'FYS', 'KEK'], ['5', '7'])