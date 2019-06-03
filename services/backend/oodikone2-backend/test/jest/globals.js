const { sequelize } = require('../../src/models/index')
const { redisClient } = require('../../src/services/redis')
const { forceSyncDatabase } = require('../../src/database/connection')
const { seedAllMigrations } = require('../../src/database/seed_migrations')

beforeAll(async () => {
  await forceSyncDatabase()
  await seedAllMigrations()
})

afterAll(async () => {
  await sequelize.close()
  await redisClient.quitAsync()
})