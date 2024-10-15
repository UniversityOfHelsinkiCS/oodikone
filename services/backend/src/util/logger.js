const os = require('os')
const winston = require('winston')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')

const { isProduction, serviceProvider } = require('../config')

const { colorize, combine, timestamp, printf } = winston.format

const transports = [new winston.transports.Console()]

if (isProduction && serviceProvider !== 'fd') {
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

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(
    colorize(),
    timestamp({ format: isProduction ? 'D.M.YYYY,HH.mm.ss' : 'HH.mm.ss' }),
    printf(({ level, message, timestamp, error, meta }) => {
      let log = `${timestamp} ${level}: ${message}`
      if (error?.stack) {
        log = `${log}\n${error.stack}`
      }
      if (Object.keys(meta || {}).length > 0) {
        log = `${log}\n${JSON.stringify(meta, null, 2)}`
      }
      return log
    })
  ),
  transports,
})

logger.on('error', error => console.error('Logging failed! Reason: ', error)) // eslint-disable-line no-console

module.exports = logger
