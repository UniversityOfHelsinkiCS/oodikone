const express = require('express')
const { redisClient } = require('./src/services/redis')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong'}))

app.get('/productivity/:id', (req, res) => {
  const { id } = req.params
  const data = JSON.parse(redisClient.get('productivity')) || {}
  res.json({ [id]: data[id] })
})
app.post('/productivity', (req, res) => {
  const data = JSON.parse(redisClient.get('productivity')) || {}
  redisClient.set('productivity', JSON.stringify({...data, ...req.body.data}))
  res.status(200).end()
})

app.get('/throughput/:id', (req, res) => {
  const { id } = req.params
  const data = JSON.parse(redisClient.get('throughput')) || {}
  res.json({ [id]: data[id] })
})
app.post('/throughput', (req, res) => {
  const data = JSON.parse(redisClient.get('throughput')) || {}
  redisClient.set('throughput', JSON.stringify({...data, ...req.body.data}))
  res.status(200).end()
})

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
