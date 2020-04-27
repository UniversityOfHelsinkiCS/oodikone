const winston = require('winston')
const Log2gelf = require('winston-log2gelf')
const { combine, timestamp, printf, splat } = winston.format
const { LOG_PORT, LOG_HOST, LOG_HOSTNAME, LOG_PROTOCOL, LOG_PATH, NODE_ENV } = process.env

const customFormat = printf(({ level, message, timestamp, ...rest }) => {
  return `${timestamp} ${level}: ${message} ${JSON.stringify(rest)}`
})

const transports = []

if (LOG_PORT && LOG_HOST) {
  transports.push(
    new Log2gelf({
      hostname: LOG_HOSTNAME || 'sis-updater-worker',
      host: LOG_HOST,
      port: LOG_PORT,
      protocol: LOG_PROTOCOL || 'http',
      protocolOptions: {
        path: LOG_PATH || '/gelf'
      },
      environment: NODE_ENV,
      service: 'SIS-UPDATER-WORKER'
    })
  )
}

if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.File({ filename: 'debug.log' }))
}

transports.push(
  new winston.transports.Console({
    level: 'debug',
    format: combine(splat(), timestamp(), customFormat)
  })
)

const logger = winston.createLogger({ transports })

module.exports = {
  logger
}
