const EventEmitter = require('events')
const knex = require('knex')
const Sequelize = require('sequelize')
const Umzug = require('umzug')

const {
  MIGRATIONS_LOCK,
  isDev,
  runningInCI,
  DB_URL,
  SIS_IMPORTER_HOST,
  SIS_IMPORTER_PORT,
  SIS_IMPORTER_USER,
  SIS_IMPORTER_PASSWORD,
  SIS_IMPORTER_DATABASE,
  SIS_PASSWORD,
} = require('../config')
const { logger } = require('../utils/logger')
const { lock } = require('../utils/redis')

class DbConnections extends EventEmitter {
  constructor() {
    super()
    this.RETRY_ATTEMPTS = 15
    this.knexConnection = false
    this.seqConnection = false

    this.sequelize = new Sequelize(DB_URL, {
      dialect: 'postgres',
      pool: {
        max: 25,
        min: 0,
        acquire: 20000,
        idle: 300000000,
      },
      password: SIS_PASSWORD,
      logging: false,
    })
  }

  establish(conn) {
    this[conn] = true
    if (this.knexConnection && this.seqConnection) this.emit('connect')
  }

  async connect(attempt = 1) {
    try {
      if (!this.knexConnection) {
        this.knex = knex({
          client: 'pg',
          connection: {
            host: SIS_IMPORTER_HOST,
            user: SIS_IMPORTER_USER,
            password: SIS_IMPORTER_PASSWORD,
            database: SIS_IMPORTER_DATABASE,
            port: SIS_IMPORTER_PORT,
            ssl: !isDev && !runningInCI ? { rejectUnauthorized: false } : false,
          },
          pool: {
            min: 0,
            max: 25,
          },
        })
        await this.knex.raw('select 1+1 as result')
        this.establish('knexConnection')
      }

      if (!this.seqConnection) {
        await this.sequelize.authenticate()
        await this.runMigrations()
        this.establish('seqConnection')
      }
    } catch (error) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', error)
        return
      }
      logger.error(`Knex database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`)
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }

  async runMigrations() {
    const unlock = await lock(MIGRATIONS_LOCK, 1000 * 60 * 10)
    try {
      const migrator = new Umzug({
        storage: 'sequelize',
        storageOptions: {
          sequelize: this.sequelize,
          tableName: 'migrations',
        },
        migrations: {
          params: [this.sequelize.getQueryInterface(), Sequelize],
          path: `${process.cwd()}/src/db/migrations`,
          pattern: /\.js$/,
        },
      })
      const migrations = (await migrator.up()).map(m => m.file)
      logger.info({ message: 'Migrations up to date', meta: migrations })
    } catch (error) {
      logger.error({ message: 'Migration error', meta: JSON.stringify(error) })
      throw error
    } finally {
      await unlock()
    }
  }
}

const dbConnections = new DbConnections()
module.exports = {
  dbConnections,
}
