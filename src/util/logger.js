const winston = require('winston')
require('winston-papertrail')
require('winston-log2gelf')
const LogSaverTransport = require('./logSaver')

const transports = []

if (process.env.LOG_PORT && process.env.LOG_HOST) {
  transports.push(new winston.transports.Log2gelf({
    hostname: process.env.LOG_HOSTNAME || 'oodikone-backend',
    host: process.env.LOG_HOST,
    port: process.env.LOG_PORT,
    protocol: 'http'
  }))
}

if (process.env.PAPERTRAIL_HOST && process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_HOSTNAME) {
  transports.push(new winston.transports.Papertrail({
    level: 'info',
    host: process.env.PAPERTRAIL_HOST,
    port: process.env.PAPERTRAIL_PORT,
    hostname: process.env.PAPERTRAIL_HOSTNAME
  }))
}

if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.File({ filename: 'debug.log' }))
}

transports.push(new winston.transports.Console({ level: 'debug' }))

transports.push(new LogSaverTransport())

const logger = new winston.createLogger({ transports })

module.exports = logger