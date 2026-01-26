import os from 'os'
import * as winston from 'winston'
import { WinstonGelfTransporter } from 'winston-gelf-transporter'
import LokiTransport from 'winston-loki'

import { isProduction, serviceProvider } from '../config'

const transports: winston.transport[] = [new winston.transports.Console()]

if (serviceProvider !== 'fd') {
  transports.push(
    new LokiTransport({
      host: 'http://loki-svc.toska-lokki.svc.cluster.local:3100',
      labels: { app: 'oodikone', environment: process.env.NODE_ENV ?? 'production' },
    }),
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
    }) as winston.transport
  )
}

const { colorize, combine, timestamp, printf } = winston.format
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(
    colorize(),
    timestamp({ format: isProduction ? 'D.M.YYYY,HH.mm.ss' : 'HH.mm.ss' }),
    printf(({ level, message, timestamp, error, meta }) => {
      let log = `${timestamp} ${level}: ${message}`
      if (error instanceof Error) {
        log = `${log}\n${error.stack}`
      }
      if (Object.keys(meta ?? {}).length > 0) {
        log = `${log}\n${JSON.stringify(meta, null, 2)}`
      }
      return log
    })
  ),
  transports,
})

logger.on('error', error => console.error('Logging failed! Reason: ', error)) // eslint-disable-line no-console

export default logger
