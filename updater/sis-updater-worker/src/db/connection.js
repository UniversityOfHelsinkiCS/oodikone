const EventEmitter = require('events')
// eslint-disable-next-line import/no-unresolved
const knex = require('knex')
// eslint-disable-next-line import/no-unresolved
const Sequelize = require('sequelize')
// eslint-disable-next-line import/no-unresolved
const Umzug = require('umzug')

const { MIGRATIONS_LOCK, isDev, runningInCI, serviceProvider } = require('../config')
const { logger } = require('../utils/logger')
const { lock } = require('../utils/redis')

const { DB_URL, SIS_IMPORTER_HOST, SIS_IMPORTER_USER, SIS_IMPORTER_PASSWORD, SIS_IMPORTER_DATABASE, SIS_PASSWORD } =
  process.env

const buildListOfMigrations = () => {
  // eslint-disable-next-line global-require
  const fs = require('fs')
  const folder = './src/db/migrations'
  const migrations = []
  fs.readdirSync(folder).forEach(file => migrations.push(file))
  const toPutLast = migrations[0]
  migrations.shift()
  migrations.push(toPutLast)
  return migrations
}

buildListOfMigrations()

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
            ssl: !isDev && !runningInCI,
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
        if (serviceProvider === 'Fd') await this.runFdMigrations()
        this.establish('seqConnection')
      }
    } catch (e) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', e)
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
      const migrations = await migrator.up()
      logger.info({ message: 'Migrations up to date', meta: JSON.stringify(migrations) })
    } catch (e) {
      logger.error({ message: 'Migration error', meta: JSON.stringify(e) })
      throw e
    } finally {
      unlock()
    }
  }

  async runFdMigrations() {
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
          path: `${process.cwd()}/src/db/migrations/fd_extra_migration`,
          pattern: /\.js$/,
        },
      })
      const migrations = await migrator.up()
      logger.info({ message: 'Migrations up to date', meta: JSON.stringify(migrations) })
    } catch (e) {
      logger.error({ message: 'Migration error', meta: JSON.stringify(e) })
      throw e
    } finally {
      unlock()
    }
  }
}

const dbConnections = new DbConnections()
module.exports = {
  dbConnections,
}
