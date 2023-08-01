const os = require('os')

const winston = require('winston')
const { WinstonGelfTransporter } = require('winston-gelf-transporter')
const sentry = require('winston-sentry-log')

const { isDev, isStaging, isProduction, sentryRelease, sentryEnvironment, runningInCI } = require('../config')
const { combine, timestamp, printf, splat } = winston.format

let transports = []

if (isProduction && !isStaging && !runningInCI) {
  const options = {
    config: {
      dsn: 'https://5fe012d12b7448d3b937f20ea941a8e5@sentry.cs.helsinki.fi/10',
      environment: sentryEnvironment,
      release: sentryRelease,
    },
    level: 'error',
  }

  transports.push(new sentry(options))
}

if (isDev) {
  const devFormat = printf(
    ({ level, message, timestamp, ...rest }) => `${timestamp} ${level}: ${message} ${JSON.stringify(rest)}`
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

  const prodFormat = winston.format.printf(({ level, ...rest }) =>
    JSON.stringify({
      level: levels[level],
      ...rest,
    })
  )

  transports.push(new winston.transports.Console({ format: prodFormat }))

  if (isProduction && !isStaging) {
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

logger.on('error', e => console.error('Logging failed! Reason: ', e)) // eslint-disable-line no-console

module.exports = {
  logger,
}
