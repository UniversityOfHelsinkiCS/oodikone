const { sequelize } = require('../../models/index')
const { seedMigrations } = require('../../database/seed_migrations')

const options = { force: true }

const sync = async () => {
  try {
    await sequelize.sync(options)
    await seedMigrations()
    console.log('Force sync succeeded. ')
    process.exit(0)
  } catch (e) {
    console.log(`Force sync failed: ${e}`)
    process.exit(1)
  }
}

sync()