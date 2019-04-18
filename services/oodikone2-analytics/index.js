const express = require('express')
const { redisClient } = require('./src/services/redis')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/ping', (req, res) => res.json({ message: 'pong'}))

app.get('/productivity/:id', async (req, res) => {
  const { id } = req.params
  const data = JSON.parse(await redisClient.getAsync('productivity')) || {}
  res.json({ [id]: data[id] })
})
app.post('/productivity', async (req, res) => {
  const data = JSON.parse(await redisClient.getAsync('productivity')) || {}
  await redisClient.setAsync('productivity', JSON.stringify({...data, ...req.body.data}))
  res.status(200).end()
})

app.get('/throughput/:id', async (req, res) => {
  const { id } = req.params
  const data = JSON.parse(await redisClient.getAsync('throughput')) || {}
  res.json({ [id]: data[id] })
})
app.post('/throughput', async (req, res) => {
  const data = JSON.parse(await redisClient.getAsync('throughput')) || {}
  await redisClient.setAsync('throughput', JSON.stringify({...data, ...req.body.data}))
  res.status(200).end()
})

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
