const { refreshAssociationsInRedis } = require('../src/services/studyrights')

const run = async () => {
  await refreshAssociationsInRedis()
  process.exit(0)
}

run()