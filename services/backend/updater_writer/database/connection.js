const Sequelize = require('sequelize')
const Umzug = require('umzug')

const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  searchPath: conf.DB_SCHEMA,
  logging: false,
  pool: {
    min: 5,
    max: 20,
    acquire: 5*60*1000
  }
})
sequelize.query(`SET SESSION search_path to ${conf.DB_SCHEMA}`)


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
        path: `${process.cwd()}/database/migrations`,
        pattern: /\.js$/,
        schema: conf.DB_SCHEMA
      }
    })
    const migrations = await migrator.up()

    console.log('Migrations up to date', migrations)
  } catch (e) {
    console.log('Migration error, message:', e)
  }
}
const migrationPromise = !conf.isTest ? runMigrations() : Promise.resolve()

const forceSyncDatabase = async () => {
  try {
    await sequelize.getQueryInterface().createSchema(conf.DB_SCHEMA)
  } catch (e) {
    // console.log(e)
  }
  console.log('OODI SYNC')
  await sequelize.sync({ force: true })
}

module.exports = {
  sequelize,
  migrationPromise,
  forceSyncDatabase
}
