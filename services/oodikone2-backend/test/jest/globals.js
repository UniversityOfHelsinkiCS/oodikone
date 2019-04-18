const { sequelize } = require('../../src/models/index')
const { redisClient } = require('../../src/services/redis')
const { forceSyncDatabase } = require('../../src/database/connection')
const { seedMigrations } = require('../../src/database/seed_migrations')

beforeAll(async () => {
  await forceSyncDatabase()
  await seedMigrations()
})

afterAll(async () => {
  await sequelize.close()
  await redisClient.quitAsync()
})