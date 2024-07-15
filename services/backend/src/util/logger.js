const os = require('os')
const winston = require('winston')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')

const { isProduction } = require('../conf-backend')

const { colorize, combine, timestamp, printf } = winston.format

const transports = [new winston.transports.Console()]

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

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(
    colorize(),
    timestamp({ format: isProduction ? 'D.M.YYYY,HH.mm.ss' : 'HH.mm.ss' }),
    printf(({ level, message, timestamp, error }) => {
      const log = `${timestamp} ${level}: ${message}`
      return error?.stack ? `${log}\n${error.stack}` : log
    })
  ),
  transports,
})

logger.on('error', error => console.error('Logging failed! Reason: ', error)) // eslint-disable-line no-console

module.exports = logger
