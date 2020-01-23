const knex = require('knex')
const EventEmitter = require('events')
const { SIS_IMPORTER_HOST, SIS_IMPORTER_USER, SIS_IMPORTER_PASSWORD, SIS_IMPORTER_DATABASE } = process.env

class DbConnections extends EventEmitter {
  constructor() {
    super()
    this.KNEX_CONNECTION = 'knexConnected'
    this.SEQUELIZE_CONNECTION = 'sequelizeConnected'
    this[this.KNEX_CONNECTION] = false
    this[this.SEQUELIZE_CONNECTION] = false
  }

  establish(connection) {
    this[connection] = true
    // TODO: Check sequelize connection as well
    if (this[this.KNEX_CONNECTION]) this.emit('connected')
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
      // TODO: Establish sequelize connection
    } catch (e) {
      if (attempt === 15) {
        this.emit('error')
        console.log(`Connection to the databases failed after ${attempt} attempts`, e)
        return
      }
      console.log(`Connection to the databases failed! Attempt ${attempt} of 15`)
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }
}

const dbConnections = new DbConnections()
module.exports = {
  dbConnections
}
