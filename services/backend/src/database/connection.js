const Sequelize = require('sequelize')
const EventEmitter = require('events')
const Umzug = require('umzug')
const conf = require('../conf-backend')
const logger = require('../util/logger')

const { SIS_DB_URL } = process.env

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
        acquire: 30000,
        idle: 300000000,
      },
      logging: false,
      password: conf.SIS_PASSWORD,
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

// Old-style kone + user db connections
const sequelizeKone = new Sequelize(conf.DB_URL_KONE, {
  schema: conf.DB_SCHEMA_KONE,
  searchPath: conf.DB_SCHEMA_KONE,
  logging: false,
  password: conf.KONE_PASSWORD,
})

sequelizeKone.query(`SET SESSION search_path to ${conf.DB_SCHEMA_KONE}`)

const sequelizeUser = new Sequelize(conf.DB_URL_USER, {
  logging: false,
  password: conf.USER_PASSWORD,
})

const initializeDatabaseConnection = async () => {
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const rounds = 60

  for (const [seq, dbName] of [
    [sequelizeKone, 'kone-db'],
    [sequelizeUser, 'user-db'],
  ]) {
    logger.info(`Connecting to ${dbName}...`)
    for (let round = 1; round <= rounds; round++) {
      try {
        await seq.authenticate()
        break
      } catch (error) {
        if (round === rounds) {
          logger.error(`${dbName} database connection failed!`)
          throw error
        }
        await sleep(1000)
      }
    }
    logger.info(`${dbName} database connection established`)

    const schema = dbName === 'kone-db' ? conf.DB_SCHEMA_KONE : undefined
    const migrationsFolder = dbName === 'kone-db' ? 'migrations_kone' : 'migrations_user'
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: seq,
        tableName: 'migrations',
        schema,
      },
      migrations: {
        params: [seq.getQueryInterface(), Sequelize],
        path: `${process.cwd()}/src/database/${migrationsFolder}`,
        pattern: /\.js$/,
        schema,
      },
    })
    try {
      const migrations = await migrator.up()
      logger.info({ message: `${dbName} migrations up to date: `, meta: migrations.map(m => m.file) })
    } catch (error) {
      logger.error({ message: `${dbName} migrations failed`, meta: error })
      throw error
    }
  }
}

const dbConnections = new DbConnection()

module.exports = {
  dbConnections,
  sequelizeKone,
  sequelizeUser,
  initializeDatabaseConnection,
}
