const os = require('os')
const winston = require('winston')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')

const { isProduction } = require('../conf-backend')

const { combine, timestamp, printf, splat } = winston.format

const transports = []

const formatDate = timestamp => {
  if (!isProduction) return new Date(timestamp).toLocaleTimeString('fi-FI').replace(' klo', '')
  return new Date(timestamp).toLocaleString('fi-FI').replace(' klo', '')
}

const consoleFormat = printf(
  ({ level, message, timestamp }) => `${formatDate(timestamp).split(' ')} ${level}: ${message}`
)

transports.push(
  new winston.transports.Console({
    level: 'debug',
    format: combine(splat(), timestamp(), consoleFormat),
  })
)

if (isProduction) {
  transports.push(
    new WinstonGelfTransporter({
      handleExceptions: true,
      host: 'svm-116.cs.helsinki.fi',
      port: 9503,
      protocol: 'udp',
      hostName: os.hostname(),
      additional: {
        app: 'oodikone',
        environment: 'production',
      },
    })
  )
}

const logger = winston.createLogger({ transports })

logger.on('error', e => console.error('Logging failed! Reason: ', e)) // eslint-disable-line no-console

module.exports = logger
