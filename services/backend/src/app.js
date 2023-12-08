require('express-async-errors')
const express = require('express')
const { baseUrl, backendPort } = require('./conf-backend')
const routes = require('./routes')
const { startCron } = require('./events')
const { initializeDatabaseConnection, dbConnections } = require('./database/connection')
const logger = require('./util/logger')
require('./worker/worker')

initializeDatabaseConnection()
  .then(() => {
    dbConnections.connect()

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
  .catch(e => {
    process.exitCode = 1
    logger.error(e)
  })
