const Sequelize = require('sequelize')
const Umzug = require('umzug')

const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  searchPath: conf.DB_SCHEMA,
  logging: false
})
sequelize.query(`SET SESSION search_path to ${conf.DB_SCHEMA}`)


const initializeDatabaseConnection = async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const waitSeconds = 60
  for (let i = 1; i <= waitSeconds; i++) {
    try {
      await sequelize.authenticate()
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
  console.log('OODI SYNC')
  await sequelize.sync({ force: true })
}

module.exports = {
  sequelize,
  initializeDatabaseConnection,
  forceSyncDatabase
}
