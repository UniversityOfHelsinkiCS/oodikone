const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const conf = require('./conf-backend')
const routes = require('./routes')
const PORT = 8080

const app = express()
app.use((req, res, next) => {
  console.log('middleware', req)
  next()
})

app.use(cors({ credentials: true, origin: conf.frontend_addr }))
app.use(bodyParser.json())


app.get('/ping', async function (req, res) {
  res.json({ data: 'pong' })
})

const BASE_URL = process.env.NODE_ENV === 'dev' ||
process.env.NODE_ENV === 'test' ? '/api' : '/'

routes(app, BASE_URL)

app.get('*', async function (req, res) {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, function () {
    console.log('Example app listening on port ' + PORT + '!')
  })
}

module.exports = app