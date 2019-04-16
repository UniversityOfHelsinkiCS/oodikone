const Course = require('../services/courses')
const { setDuplicateCode } = require('../services/courses')
const { redisClient }= require('../services/redis')

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
  console.log('Mapped course codes with similar names with codes starting with ', newPrefixes, ' to  ', oldPrefixes)
  process.exit()
}

const updateRedis = async (codes) => {

  for (const i in codes) {
    let code = codes[i]
    const newCode = Object.keys(code)[0]
    const oldCode = code[newCode]

    await setDuplicateCode(newCode, oldCode)
    await setDuplicateCode(oldCode, newCode)
  }
}

mapCourseCodes(['CSM', 'TKT', 'MAT', 'FYS', 'KEK'], ['5', '7'])