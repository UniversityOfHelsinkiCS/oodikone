const { sequelize } = require('../../src/models/index')
const { sequelizeKone } = require('../../src/models/models_kone')
const { redisClient } = require('../../src/services/redis')
const { forceSyncDatabase } = require('../../src/database/connection')
const { seedAllMigrations } = require('../../src/database/seed_migrations')

beforeAll(async () => {
  await forceSyncDatabase()
  await seedAllMigrations()
})

afterAll(async () => {
  await sequelize.close()
  await sequelizeKone.close()
  // https://stackoverflow.com/a/54560610
  await new Promise(res => redisClient.quit(() => setImmediate(res)))
})