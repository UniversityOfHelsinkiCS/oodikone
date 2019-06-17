const { seedMigrations } = require('./seed_migrations')
const { forceSyncDatabase } = require('./connection')

const sync = async () => {
  try {
    await forceSyncDatabase()
    await seedMigrations()
    console.log('Force sync succeeded. ')
    process.exit(0)
  } catch (e) {
    console.log(`Force sync failed: ${e}`)
    process.exit(1)
  }
}

sync()