const { redisClient } = require('../services/redis')


const initializeDuplicates = async () => {
  await redisClient.setAsync('duplicates', '{}')
  console.log('Initiated redis')
  process.exit()
}

initializeDuplicates()