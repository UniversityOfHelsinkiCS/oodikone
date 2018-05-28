const redis = require('redis')
const Course = require('../services/courses')
const conf = require('../conf-backend')

// two tables of prefixes, for example old prefixes of  Matlu courses:
// ['5', '7'] 
// and new prefixes
// ['CSM', 'DATA', 'FYS', 'MAT', 'TKT', 'KEK']
const mapCourseCodes = async (oldPrefixes, newPrefixes) => {
  const res = await Course.findDuplicates(oldPrefixes, newPrefixes)
  const mappedCodes = res ? res[0] : []
  const app = mappedCodes.map(r => { return { [r.code1] : r.code2 } })
  console.log(app)
}

const updateRedis = async () => {
  const redisClient = redis.createClient(6379, conf.redis)
  await redisClient.set('my test key', 'my test value', redis.print)
  redisClient.get('my test key', (err, res) => {
    console.log(res)
  })
}

mapCourseCodes(['CSM', 'TKT', 'MAT', 'FYS', 'KEK'], ['5', '7'])
updateRedis()