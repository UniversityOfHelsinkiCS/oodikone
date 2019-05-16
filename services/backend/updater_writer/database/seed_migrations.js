const fs = require('fs')
const { Migration } = require('../models/index')

const DEFAULT_PATH = `${process.cwd()}/database/migrations`

const saveMigrationsToDatabase = async filenames => Promise.all(filenames.map(name => Migration.upsert({ name })))

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