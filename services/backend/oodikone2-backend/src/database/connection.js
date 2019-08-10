const Sequelize = require('sequelize')
const Umzug = require('umzug')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  searchPath: conf.DB_SCHEMA,
  logging: false
})
sequelize.query(`SET SESSION search_path to ${conf.DB_SCHEMA}`)

const sequelizeKone = new Sequelize(conf.DB_URL_KONE, {
  schema: conf.DB_SCHEMA_KONE,
  searchPath: conf.DB_SCHEMA_KONE,
  logging: false
})
sequelizeKone.query(`SET SESSION search_path to ${conf.DB_SCHEMA_KONE}`)


const initializeDatabaseConnection = async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const waitSeconds = 60
  for (let i = 1; i <= waitSeconds; i++) {
    try {
      await sequelize.authenticate()
      await sequelizeKone.authenticate()
      break
    } catch (e) {
      if (i === waitSeconds) {
        console.log(`Could not connect to database in ${waitSeconds} seconds`)
        throw e
      }
      console.log('.')
      await sleep(1000)
    }
  }
  if (!conf.isTest) {
    try {
      const migrator = new Umzug({
        storage: 'sequelize',
        storageOptions: {
          sequelize: sequelizeKone,
          tableName: 'migrations',
          schema: conf.DB_SCHEMA_KONE
        },
        logging: console.log,
        migrations: {
          params: [
            sequelizeKone.getQueryInterface(),
            Sequelize
          ],
          path: `${process.cwd()}/src/database/migrations_kone`,
          pattern: /\.js$/,
          schema: conf.DB_SCHEMA_KONE
        },
      })
      const migrations = await migrator.up()

      console.log('Kone Migrations up to date', migrations)
    } catch (e) {
      console.log('Kone Migration error')
      throw e
    }
  }
}

const forceSyncDatabase = async () => {
  try {
    await sequelize.getQueryInterface().createSchema(conf.DB_SCHEMA)
  } catch (e) {
    // console.log(e)
  }
  try {
    await sequelizeKone.getQueryInterface().createSchema(conf.DB_SCHEMA_KONE)
  } catch (e) {
    // console.log(e)
  }
  await sequelize.sync({ force: true })
  await sequelizeKone.sync({ force: true })
}

module.exports = {
  sequelize,
  sequelizeKone,
  initializeDatabaseConnection,
  forceSyncDatabase
}