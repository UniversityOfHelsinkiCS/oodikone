const os = require('os')
const winston = require('winston')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')
const Sentry = require('winston-sentry-log')

const {
  isDev,
  isStaging,
  isProduction,
  sentryRelease,
  sentryEnvironment,
  sentryDSN,
  runningInCI,
} = require('../config')

const { colorize, combine, timestamp, printf } = winston.format

const transports = []

if (isProduction && !isStaging && !runningInCI && sentryDSN) {
  const options = {
    config: {
      dsn: sentryDSN,
      environment: sentryEnvironment,
      release: sentryRelease,
    },
    level: 'error',
  }

  transports.push(new Sentry(options))
}

const devFormat = printf(
  ({ timestamp, level, message, error, ...rest }) =>
    `${timestamp} ${level}: ${message}${error ? ` ${error?.stack}` : ''}${rest ? ` ${JSON.stringify(rest)}` : ''}`
)

const prodFormat = printf(({ timestamp, level, ...rest }) => JSON.stringify({ timestamp, level, ...rest }))

transports.push(
  new winston.transports.Console({
    level: isDev ? 'debug' : 'info',
    format: combine(
      colorize(),
      timestamp({ format: isDev ? 'HH.mm.ss' : 'D.M.YYYY klo HH.mm.ss' }),
      isDev ? devFormat : prodFormat
    ),
  })
)

if (isProduction && !isStaging) {
  transports.push(
    new WinstonGelfTransporter({
      handleExceptions: true,
      host: 'svm-116.cs.helsinki.fi',
      port: 9503,
      protocol: 'udp',
      hostName: os.hostname(),
      additional: {
        app: 'updater-worker',
        environment: 'production',
      },
    })
  )
}

const logger = winston.createLogger({ transports })

logger.on('error', error => console.error('Logging failed. Reason: ', error)) // eslint-disable-line no-console

module.exports = {
  logger,
}
