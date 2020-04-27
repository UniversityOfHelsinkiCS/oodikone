const winston = require('winston')
const Log2gelf = require('winston-log2gelf')
const LogSaverTransport = require('./logSaver')

const transports = []

// don't spam console/file system with logs, only use this for sending usage logs to graylog & db

if (process.env.LOG_PORT && process.env.LOG_HOST) {
  transports.push(
    new Log2gelf({
      hostname: process.env.LOG_HOSTNAME || 'oodikone-usageservice',
      host: process.env.LOG_HOST,
      port: process.env.LOG_PORT,
      protocol: process.env.LOG_PROTOCOL || 'http',
      environment: process.env.NODE_ENV,
      protocolOptions: {
        path: process.env.LOG_PATH || '/gelf'
      }
    })
  )
}

transports.push(new LogSaverTransport())

const logger = new winston.createLogger({ transports })

module.exports = logger
