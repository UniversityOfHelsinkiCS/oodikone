require('express-async-errors')
const express = require('express')
const cors = require('cors')
const Sentry = require('@sentry/node')
const { baseUrl, backendPort, frontUrl } = require('./conf-backend')
const routes = require('./routes')
const { startCron } = require('./events')
const { initializeDatabaseConnection, dbConnections } = require('./database/connection')
const initializeSentry = require('./util/sentry')
const errorMiddleware = require('./middleware/errormiddleware')
const logger = require('./util/logger')

initializeDatabaseConnection()
  .then(() => {
    dbConnections.connect()

    dbConnections.on('connect', () => {
      logger.info('Connected to sis db successfully')
    })

    dbConnections.on('error', () => {
      logger.error('Failed to connect to sis db!')
    })

    const app = express()
    initializeSentry(app)
    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())

    startCron()

    app.use(cors({ credentials: true, origin: frontUrl }))
    app.use(express.json())

    routes(app, baseUrl)

    app.get('*', async (_, res) => {
      const results = { error: 'unknown endpoint' }
      res.status(404).json(results)
    })

    app.use(Sentry.Handlers.errorHandler())

    app.use(errorMiddleware)

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
