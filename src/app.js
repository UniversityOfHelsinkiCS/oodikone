const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const Raven = require('raven')
const conf = require('./conf-backend')
const routes = require('./routes')
const PORT = 8080
const app = express()

Raven.config(process.env.SENTRY_ADDR).install()

app.use(cors({ credentials: true, origin: conf.frontend_addr }))
app.use(bodyParser.json())

app.get('/ping', async (req, res) => {
  res.json({ data: 'pong' })
})

const BASE_URL = process.env.NODE_ENV === 'dev' ||
  process.env.NODE_ENV === 'test' ? '/api' : '/'

routes(app, BASE_URL)

app.get('*', async (req, res) => {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

module.exports = app.listen(PORT, () => {
  console.log('Example app listening on port ' + PORT + '!')
})
