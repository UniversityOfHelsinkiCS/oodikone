const Sequelize = require('sequelize')
const Umzug = require('umzug')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})

const runMigrations = async () => {
  try {
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelize,
        tableName: 'migrations'
      },
      logging: console.log,
      migrations: {
        params: [
          sequelize.getQueryInterface(),
          Sequelize
        ],
        path: `${process.cwd()}/src/database/migrations`,
        pattern: /\.js$/,
      }
    })
    const migrations = await migrator.up()

    console.log('Migrations up to date', migrations)
  } catch (e) {
    console.log('Migration error, message:', e)
  }
}

const migrationPromise = conf.DB_SCHEMA === 'public' ? runMigrations()
  : Promise.resolve()

const forceSyncDatabase = async () => {
  await sequelize.sync({ force: true })
}

module.exports = { sequelize, migrationPromise, forceSyncDatabase }