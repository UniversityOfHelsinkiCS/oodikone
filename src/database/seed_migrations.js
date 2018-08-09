const fs = require('fs')
const { Migration } = require('../models/index')

const DEFAULT_PATH = `${process.cwd()}/src/database/migrations`

const saveMigrationsToDatabase = filenames => Migration.bulkCreate(filenames)

const seedMigrations = async (migrationfilepath=DEFAULT_PATH) => {
  const filenames = fs.readdirSync(migrationfilepath)
  await saveMigrationsToDatabase(filenames)
}

const run = async () => {
  await seedMigrations()
}

module.exports = {
  run,
  seedMigrations
}