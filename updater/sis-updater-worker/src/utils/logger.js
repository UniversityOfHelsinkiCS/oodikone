import os from 'os'
import winston from 'winston'
import { WinstonGelfTransporter } from 'winston-gelf-transporter'
import LokiTransport from 'winston-loki'
import Sentry from 'winston-transport-sentry-node'

import { isDev, isStaging, isProduction, runningInCI, serviceProvider, SENTRY_DSN } from '../config.js'

const { colorize, combine, timestamp, printf, uncolorize } = winston.format

const transports = []

if (isProduction && !isStaging && !runningInCI && SENTRY_DSN) {
  transports.push(new Sentry({ level: 'error' }))
}

const devFormat = printf(
  ({ timestamp, level, message, error, ...rest }) =>
    `${timestamp} ${level}: ${message}${error ? ` ${error?.stack}` : ''}${rest ? ` ${JSON.stringify(rest)}` : ''}`
)

const prodFormat = printf(({ timestamp, level, message, error, ...rest }) => {
  const log = { timestamp, level, message, ...rest }
  if (error) {
    log.error = error?.stack
  }
  return JSON.stringify(log)
})

transports.push(
  new winston.transports.Console({
    level: isDev ? 'debug' : 'info',
    format: combine(
      isDev ? colorize() : uncolorize(),
      timestamp({ format: isDev ? 'HH.mm.ss' : 'D.M.YYYY klo HH.mm.ss' }),
      isDev ? devFormat : prodFormat
    ),
  })
)

if (serviceProvider !== 'fd') {
  transports.push(
    new LokiTransport({
      host: 'http://loki-svc.toska-lokki.svc.cluster.local:3100',
      labels: { app: 'updater-worker', environment: process.env.NODE_ENV ?? 'production' },
    })
  )
}

if (isProduction && !isStaging && serviceProvider !== 'fd') {
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

export default logger
