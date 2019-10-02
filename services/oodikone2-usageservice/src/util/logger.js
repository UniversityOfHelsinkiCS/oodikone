const winston = require('winston')
const Log2gelf = require('winston-log2gelf')

const transports = []

if (process.env.LOG_PORT && process.env.LOG_HOST) {
  transports.push(
    new Log2gelf({
      // push warnings & errors to graylog
      level: 'warn',
      hostname: process.env.LOG_HOSTNAME || 'oodikone-usageservice',
      host: process.env.LOG_HOST,
      port: process.env.LOG_PORT,
      protocol: 'http'
    })
  )
}

transports.push(new winston.transports.Console({ level: 'info' }))

const logger = new winston.createLogger({ transports })

module.exports = logger
