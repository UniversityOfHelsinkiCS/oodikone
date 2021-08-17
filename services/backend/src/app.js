const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const Sentry = require('@sentry/node')
const conf = require('./conf-backend')
const routes = require('./routes')
const { startCron } = require('./events')
const { PORT } = conf
const { initializeDatabaseConnection, dbConnections } = require('./database/connection')

const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || ''
const SENTRY_RELEASE = process.env.SENTRY_ENVIRONMENT || ''

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

    if (SENTRY_ENVIRONMENT && SENTRY_RELEASE) {
      Sentry.init({
        dsn: 'https://020b79f0cbb14aad94cc9d69a1ea9d52@sentry.cs.helsinki.fi/2',
        environment: SENTRY_ENVIRONMENT,
        release: SENTRY_RELEASE,
      })
      app.use(Sentry.Handlers.requestHandler())
    }

    startCron()

    app.use(cors({ credentials: true, origin: conf.frontend_addr }))
    app.use(bodyParser.json())

    let BASE_URL = ''
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      BASE_URL = '/api'
    }

    routes(app, BASE_URL)

    app.get('*', async (req, res) => {
      const results = { error: 'unknown endpoint' }
      res.status(404).json(results)
    })

    app.use(Sentry.Handlers.errorHandler())

    const server = app.listen(PORT, () => console.log(`Backend listening on port ${PORT}!`))
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
