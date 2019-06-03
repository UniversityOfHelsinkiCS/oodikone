const { seedAllMigrations } = require('../src/database/seed_migrations')

const run = async () => {
  try {
    await seedAllMigrations()
    process.exit(0)
  } catch (e) {
    console.log(`Seeding migrations failed: ${e}`)
    process.exit(1)
  }
}

run()