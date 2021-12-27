const Sequelize = require('sequelize')
const EventEmitter = require('events')
const Umzug = require('umzug')
const conf = require('../conf-backend')
const { SIS_DB_URL } = process.env
const logger = require('../util/logger')

class DbConnection extends EventEmitter {
  constructor() {
    super()
    this.RETRY_ATTEMPTS = 15
    this.established = false

    this.sequelize = new Sequelize(SIS_DB_URL, {
      dialect: 'postgres',
      pool: {
        max: 25,
        min: 0,
        acquire: 10000,
        idle: 300000000,
      },
      logging: false,
    })
  }

  async connect(attempt = 1) {
    try {
      await this.sequelize.authenticate()
      this.emit('connect')
      this.established = true
    } catch (e) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', e)
        return
      }
      logger.error({ message: `Sis database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`, meta: e })
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }
}

const sequelizeKone = new Sequelize(conf.DB_URL_KONE, {
  schema: conf.DB_SCHEMA_KONE,
  searchPath: conf.DB_SCHEMA_KONE,
  logging: false,
})
sequelizeKone.query(`SET SESSION search_path to ${conf.DB_SCHEMA_KONE}`)

const sequelizeUser = new Sequelize(conf.DB_URL_USER, {
  logging: false,
})

const initializeDatabaseConnection = async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const waitSeconds = 60
  for (let i = 1; i <= waitSeconds; i++) {
    try {
      await sequelizeKone.authenticate()
      break
    } catch (e) {
      if (i === waitSeconds) {
        logger.error(`Could not connect to kone database in ${waitSeconds} seconds`)
        throw e
      }
      await sleep(1000)
    }
  }
  try {
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelizeKone,
        tableName: 'migrations',
        schema: conf.DB_SCHEMA_KONE,
      },
      migrations: {
        params: [sequelizeKone.getQueryInterface(), Sequelize],
        path: `${process.cwd()}/src/database/migrations_kone`,
        pattern: /\.js$/,
        schema: conf.DB_SCHEMA_KONE,
      },
    })
    const migrations = await migrator.up()
    logger.info({ message: 'Kone Migrations up to date', meta: migrations })
  } catch (e) {
    logger.error({ message: 'Kone Migration error: ', meta: e })
    throw e
  }

  for (let i = 1; i <= waitSeconds; i++) {
    try {
      await sequelizeUser.authenticate()
      break
    } catch (e) {
      if (i === waitSeconds) {
        logger.error(`Could not connect to user database in ${waitSeconds} seconds`)
        throw e
      }
      await sleep(1000)
    }
  }

  try {
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelizeUser,
        tableName: 'migrations',
      },
      migrations: {
        params: [sequelizeUser.getQueryInterface(), Sequelize],
        path: `${process.cwd()}/src/database/migrations_user`,
        pattern: /\.js$/,
      },
    })
    const migrations = await migrator.up()
    logger.info({ message: 'Kone Migrations up to date', meta: migrations })
  } catch (e) {
    logger.error({ message: 'Kone Migration error: ', meta: e })
    throw e
  }
}

const dbConnections = new DbConnection()
module.exports = {
  dbConnections,
  sequelizeKone,
  sequelizeUser,
  initializeDatabaseConnection,
}
