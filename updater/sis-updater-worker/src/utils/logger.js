const os = require('os')
const winston = require('winston')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')
const Sentry = require('winston-sentry-log')
const { isDev, isStaging, isProduction, sentryRelease, sentryEnvironment, runningInCI } = require('../config')

const { combine, timestamp, printf, splat } = winston.format

const transports = []

const formatDate = timestamp => new Date(timestamp).toLocaleString('fi-FI')

if (isProduction && !isStaging && !runningInCI) {
  const options = {
    config: {
      dsn: 'https://b9947dc630a74f00b4db6afd50cfa906@toska.cs.helsinki.fi/17',
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

  const prodFormat = printf(({ timestamp, level, ...rest }) =>
    JSON.stringify({
      timestamp: formatDate(timestamp),
      level: levels[level],
      ...rest,
    })
  )

  transports.push(new winston.transports.Console({ format: combine(splat(), timestamp(), prodFormat) }))

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
}

const logger = winston.createLogger({ transports })

logger.on('error', e => console.error('Logging failed. Reason: ', e)) // eslint-disable-line no-console

module.exports = {
  logger,
}
