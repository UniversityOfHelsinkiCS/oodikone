const Sequelize = require('sequelize')
const EventEmitter = require('events')
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
      console.log(`Sis database connection failed! Attempt ${attempt}/${this.RETRY_ATTEMPTS}`)
      console.log(e)
      setTimeout(() => this.connect(attempt + 1), 1000 * attempt)
    }
  }
}

const dbConnections = new DbConnection()
dbConnections
module.exports = {
  dbConnections,
}
