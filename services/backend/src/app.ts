import 'express-async-errors'
import express from 'express'

import { baseUrl, backendPort } from './config'
import { initializeDatabaseConnection, dbConnections } from './database/connection'
import { startCron } from './events'
import routes from './routes'
import logger from './util/logger'
import './worker/worker'

initializeDatabaseConnection()
  .then(() => {
    void dbConnections.connect()

    dbConnections.on('connect', () => {
      logger.info('Connected to sis db successfully')
    })

    dbConnections.on('error', () => {
      logger.error('Failed to connect to sis db!')
    })
    startCron()

    const app = express()
    routes(app, baseUrl)

    const server = app.listen(backendPort, () => logger.info(`Backend listening on port ${backendPort}!`))
    process.on('SIGTERM', () => {
      server.close(() => {
        logger.info('Process terminated')
      })
    })
  })
  .catch(error => {
    process.exitCode = 1
    logger.error(error)
  })
