const winston = require('winston')
const Log2gelf = require('winston-log2gelf')

const transports = []

if (process.env.LOG_PORT && process.env.LOG_HOST) {
  transports.push(new Log2gelf({
    hostname: process.env.LOG_HOSTNAME || 'UPDATER',
    host: process.env.LOG_HOST,
    port: process.env.LOG_PORT,
    protocol: 'http'
  }))
}

if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.File({ filename: 'debug.log' }))
}

transports.push(new winston.transports.Console({ level: 'debug' }))


const logger = winston.createLogger({ transports })

module.exports = logger