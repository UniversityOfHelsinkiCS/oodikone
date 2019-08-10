const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const Raven = require('raven')
const conf = require('./conf-backend')
const routes = require('./routes')
const { startCron } = require('./events')
const { PORT } = conf
const { initializeDatabaseConnection } = require('./database/connection')

initializeDatabaseConnection().then(() => {
  const app = express()

  startCron()

  Raven.config(process.env.SENTRY_ADDR, { captureUnhandledRejections: true }).install()

  app.use(cors({ credentials: true, origin: conf.frontend_addr }))
  app.use(bodyParser.json())

  app.get('/ping', async (req, res) => {
    res.json({ data: 'pong' })
  })

  let BASE_URL = ''
  if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'test') {
    BASE_URL = '/api'
  }

  routes(app, BASE_URL)

  app.get('*', async (req, res) => {
    const results = { error: 'unknown endpoint' }
    res.status(404).json(results)
  })

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
