const knex = require('knex')
const EventEmitter = require('events')
const Sequelize = require('sequelize')
const { SIS_IMPORTER_HOST, SIS_IMPORTER_USER, SIS_IMPORTER_PASSWORD, SIS_IMPORTER_DATABASE, SIS_DB_URL } = process.env

const sequelize = new Sequelize(SIS_DB_URL, {
  pool: {
    min: 0,
    max: 5
  }
})

class DbConnections extends EventEmitter {
  constructor() {
    super()
    this.KNEX_CONNECTION = 'knexConnected'
    this.SEQUELIZE_CONNECTION = 'sequelizeConnected'
    this.RETRY_ATTEMPTS = 15
    this[this.KNEX_CONNECTION] = false
    this[this.SEQUELIZE_CONNECTION] = false
  }

  establish(connection) {
    this[connection] = true
    if (this[this.KNEX_CONNECTION] && this[this.SEQUELIZE_CONNECTION]) this.emit('connected')
  }

  async connect(attempt = 1) {
    try {
      if (!this[this.KNEX_CONNECTION]) {
        this.knex = knex({
          client: 'pg',
          version: '9.6.3',
          connection: {
            host: SIS_IMPORTER_HOST,
            user: SIS_IMPORTER_USER,
            password: SIS_IMPORTER_PASSWORD,
            database: SIS_IMPORTER_DATABASE
          },
          pool: {
            min: 0,
            max: 5
          }
        })
        await this.knex.raw('select 1+1 as result')
        this.establish(this.KNEX_CONNECTION)
      }

      if (!this[this.SEQUELIZE_CONNECTION]) {
        await sequelize.authenticate()
        this.sequelize = sequelize
        this.establish(this.SEQUELIZE_CONNECTION)
      }
    } catch (e) {
      if (attempt > this.RETRY_ATTEMPTS) {
        this.emit('error', e)
        return
      }
      console.log(`Some database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`)
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }
}

const dbConnections = new DbConnections()
module.exports = {
  dbConnections
}
