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
  serviceProvider
} = require('../config')

const { combine, timestamp, printf, splat } = winston.format

const formatDate = timestamp => new Date(timestamp).toLocaleString('fi-FI')

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

if (isDev) {

  const devFormat = printf(
    ({ level, message, timestamp, ...rest }) => `${formatDate(timestamp)} ${level}: ${message} ${JSON.stringify(rest)}`
  )

  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: combine(splat(), timestamp(), devFormat),
    })
  )
} else {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  }

  const prodFormat = printf(({ level, timestamp, ...rest }) =>
    JSON.stringify({
      level: levels[level],
      timestamp: formatDate(timestamp),
      ...rest,
    })
  )

  transports.push(new winston.transports.Console({ format: combine(splat(), timestamp(), prodFormat) }))

  if (isProduction && !isStaging && serviceProvider !== 'Fd') {
    transports.push(
      new WinstonGelfTransporter({
        handleExceptions: true,
        host: 'svm-116.cs.helsinki.fi',
        port: 9503,
        protocol: 'udp',
        hostName: os.hostname(),
        additional: {
          app: 'updater-scheduler',
          environment: 'production',
        },
      })
    )
  }
}

const logger = winston.createLogger({ transports })

logger.on('error', error => console.error('Logging failed! Reason: ', error)) // eslint-disable-line no-console

module.exports = {
  logger,
}
