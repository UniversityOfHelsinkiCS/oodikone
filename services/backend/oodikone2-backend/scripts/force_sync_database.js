const { sequelize, sequelizeKone } = require('../src/models/index')
const { seedAllMigrations } = require('../src/database/seed_migrations')

const options = { force: true }

const sync = async () => {
  try {
    await sequelize.sync(options)
    await sequelizeKone.sync(options)
    await seedAllMigrations()
    console.log('Force sync succeeded. ')
    process.exit(0)
  } catch (e) {
    console.log(`Force sync failed: ${e}`)
    process.exit(1)
  }
}

sync()