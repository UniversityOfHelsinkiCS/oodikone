import { EventEmitter } from 'events'
import knex from 'knex'
import { Sequelize } from 'sequelize'
import { Umzug, SequelizeStorage } from 'umzug'

import {
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
} from '../config.js'
import logger from '../utils/logger.js'
import { lock } from '../utils/redis.js'

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
      logging: false,
      password: SIS_PASSWORD,
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
        storage: new SequelizeStorage({
          sequelize: this.sequelize,
          tableName: 'migrations',
        }),
        migrations: {
          glob: 'src/db/migrations/*.cjs',
          resolve: ({ name, path, context }) => {
            const getMigration = () => import(path)
            return {
              // Migration names need to end in .js for legacy reasons
              // modifying this behaviour requires manually altering the db 'migrations' table
              // else umzug will attempt to reapply all migrations
              // which will not work for many of them -> would need to rewrite migration files..
              name: name.replace(/\.cjs$/, '.js'),
              up: async () => (await getMigration()).up(context, Sequelize),
              down: async () => (await getMigration()).down(context, Sequelize),
            }
          },
        },
        context: this.sequelize.getQueryInterface(),
        logger,
      })

      const migrations = (await migrator.up()).map(m => m.name)
      logger.info({ message: 'Migrations up to date', meta: migrations })
    } catch (error) {
      logger.error({ message: 'Migration error', meta: JSON.stringify(error) })
      throw error
    } finally {
      await unlock()
    }
  }
}

export const dbConnections = new DbConnections()
export const { sequelize } = dbConnections
