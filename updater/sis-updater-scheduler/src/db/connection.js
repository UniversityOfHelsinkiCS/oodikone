const EventEmitter = require('events')
const knex = require('knex')

const {
  isDev,
  runningInCI,
  SIS_IMPORTER_HOST,
  SIS_IMPORTER_PORT,
  SIS_IMPORTER_USER,
  SIS_IMPORTER_PASSWORD,
  SIS_IMPORTER_DATABASE,
} = require('../config')
const { logger } = require('../utils/logger')

class KnexConnection extends EventEmitter {
  constructor() {
    super()
    this.RETRY_ATTEMPTS = 15
  }

  async connect(attempt = 1) {
    try {
      this.knex = knex({
        client: 'pg',
        connection: {
          port: SIS_IMPORTER_PORT,
          host: SIS_IMPORTER_HOST,
          user: SIS_IMPORTER_USER,
          password: SIS_IMPORTER_PASSWORD,
          database: SIS_IMPORTER_DATABASE,
          ssl: !isDev && !runningInCI ? { rejectUnauthorized: false } : false,
        },
        pool: {
          min: 0,
          max: 5,
        },
      })
      await this.knex.raw('select 1+1 as result')
      this.emit('connect')
    } catch (error) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', error)
        return
      }
      logger.error(`Knex database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`)
      logger.error(`Error while connecting: ${JSON.stringify(error, null, 2)}`)
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }
}

const knexConnection = new KnexConnection()
module.exports = {
  knexConnection,
}
