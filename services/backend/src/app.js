import 'express-async-errors'
import express from 'express'

import { baseUrl, backendPort } from './conf-backend'
import { initializeDatabaseConnection, dbConnections } from './database/connection'
import { startCron } from './events'
import routes from './routes'
import { info, error } from './util/logger'
import './worker/worker'

initializeDatabaseConnection()
  .then(() => {
    dbConnections.connect()

    dbConnections.on('connect', () => {
      info('Connected to sis db successfully')
    })

    dbConnections.on('error', () => {
      error('Failed to connect to sis db!')
    })
    startCron()

    const app = express()
    routes(app, baseUrl)

    const server = app.listen(backendPort, () => info(`Backend listening on port ${backendPort}!`))
    process.on('SIGTERM', () => {
      server.close(() => {
        info('Process terminated')
      })
    })
  })
  .catch(e => {
    process.exitCode = 1
    error(e)
  })
