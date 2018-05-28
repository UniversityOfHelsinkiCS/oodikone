const redis = require('redis')
const Course = require('../services/courses')
const conf = require('../conf-backend')

const redisClient = redis.createClient(6379, conf.redis)

// two tables of prefixes, for example new prefixes of  Matlu courses:
// ['CSM', 'DATA', 'FYS', 'MAT', 'TKT', 'KEK'] 
// and old prefixes
// ['5', '7']

const mapCourseCodes = async (newPrefixes, oldPrefixes) => {
  const res = await Course.findDuplicates(newPrefixes, oldPrefixes)
  const mappedCodes = res ? res[0] : []
  const formattedCodes = mappedCodes.map(r => { return { [r.code1]: r.code2 } })
  updateRedis(formattedCodes)
}

const redisGetAndSet = (code1, code2) => {
  redisClient.get(code1, (error, res) => {
    if (res) {
      console.log(code1, ':', res)
      const json = JSON.parse(res)
      if (!json.includes(code2)) {
        json.push(code2)
        redisClient.set(code1, JSON.stringify(json))
      }
    } else {
      
      redisClient.set(code1, JSON.stringify([code2]))
    }
  })
}

const updateRedis = async (codes) => {
  codes.forEach(code => {
    const newCode = Object.keys(code)[0]
    const oldCode = code[newCode]
    redisGetAndSet(newCode, oldCode)
    redisGetAndSet(oldCode, newCode)
  })
}

mapCourseCodes(['CSM', 'TKT', 'MAT', 'FYS', 'KEK'], ['5', '7'])