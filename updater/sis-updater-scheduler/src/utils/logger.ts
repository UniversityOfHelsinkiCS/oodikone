import winston from 'winston'
import LokiTransport from 'winston-loki'
import SentryTransport from 'winston-transport-sentry-node'

import { isDev, isStaging, isProduction, runningInCI, SENTRY_DSN } from '../config'

const { combine, timestamp, printf, colorize, uncolorize } = winston.format

const transports: winston.transport[] = []

if (isProduction && !isStaging && !runningInCI && SENTRY_DSN) {
  transports.push(new SentryTransport({ level: 'error' }))
}

// TODO: Type this
const devFormat = printf(
  ({ timestamp, level, message, error, ...rest }: any) =>
    `${timestamp} ${level}: ${message}${error ? ` ${error.stack}` : ''}${rest ? ` ${JSON.stringify(rest)}` : ''}`
)

// TODO: Type this
const prodFormat = printf(({ timestamp, level, message, error, ...rest }: any) => {
  const log = { timestamp, level, message, ...rest }
  if (error) {
    log.error = error.stack
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

transports.push(
  new LokiTransport({
    host: 'http://loki-svc.toska-lokki.svc.cluster.local:3100',
    labels: { app: 'updater-scheduler', environment: process.env.NODE_ENV ?? 'production' },
  })
)

export const logger = winston.createLogger({ transports })

logger.on('error', error => console.error('Logging failed! Reason: ', error)) // eslint-disable-line no-console
