const Sequelize = require('sequelize')
const Umzug = require('umzug')
const conf = require('../conf')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false
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
const migrationPromise = process.env.NODE_ENV != 'test' ? runMigrations().catch((e) => { console.log(e); process.exitCode = 1; process.kill(process.pid, 'SIGTERM'); })
  : Promise.resolve()

const forceSyncDatabase = async () => {
  await sequelize.sync({ force: true })
}

module.exports = { sequelize, migrationPromise, forceSyncDatabase }
