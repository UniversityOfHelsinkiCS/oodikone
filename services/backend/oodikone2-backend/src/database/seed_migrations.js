const fs = require('fs')
const { Migration, MigrationKone } = require('../models/index')

const DEFAULT_PATH = `${process.cwd()}/src/database/migrations`
const DEFAULT_PATH_KONE = `${process.cwd()}/src/database/migrations_kone`

const saveMigrationsToDatabase = Migration => async filenames =>
  Promise.all(filenames.map(name => Migration.upsert({ name })))

const seedMigrations = async (migrationfilepath=DEFAULT_PATH) => {
  const filenames = fs.readdirSync(migrationfilepath)
  await saveMigrationsToDatabase(Migration)(filenames)
}

const seedMigrationsKone = async (migrationfilepath=DEFAULT_PATH_KONE) => {
  const filenames = fs.readdirSync(migrationfilepath)
  await saveMigrationsToDatabase(MigrationKone)(filenames)
}

const seedAllMigrations = async () => {
  await seedMigrations()
  await seedMigrationsKone()
}

module.exports = {
  seedAllMigrations
}