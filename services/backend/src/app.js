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

initializeDatabaseConnection()
  .then(() => {
    dbConnections.connect()

    dbConnections.on('connect', () => {
      console.log('Connected to sis db successfully')
    })

    dbConnections.on('error', () => {
      console.log('Failed connecting to sis db')
    })

    const app = express()
    initializeSentry(app)
    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())

    startCron()

    app.use(cors({ credentials: true, origin: frontUrl }))
    app.use(express.json())

    routes(app, baseUrl)

    app.get('*', async (req, res) => {
      const results = { error: 'unknown endpoint' }
      res.status(404).json(results)
    })

    app.use(Sentry.Handlers.errorHandler())

    app.use(errorMiddleware)

    const server = app.listen(backendPort, () => console.log(`Backend listening on port ${backendPort}!`))
    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Process terminated')
      })
    })
  })
  .catch(e => {
    process.exitCode = 1
    console.log(e)
  })
