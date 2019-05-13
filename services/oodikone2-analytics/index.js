const express = require('express')
const _ = require('lodash')

const morgan = require('morgan')

const { redisClient } = require('./src/services/redis')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(morgan('tiny'))

app.get('/ping', (req, res) => res.json({ message: 'pong'}))

const getCached = async (key) => {
  try {
    const cached = await redisClient.getAsync(key)
    if (cached) return JSON.parse(cached)
  } catch (e) {
    console.error(e)
  }
  return null
}

const setCached = async (key, data) => {
  try {
    await redisClient.setAsync(key, JSON.stringify(data))
  } catch (e) {
    console.error(e)
  }
}

app.get('/productivity/:id', async (req, res) => {
  const { id } = req.params
  const data = await getCached('productivity')

  if (data && data[id]) res.json({ [id]: data[id] })

  else res.json(null)
})
app.post('/productivity', async (req, res) => {
  const data = await getCached('productivity')
  await setCached('productivity', { ...data, ...req.body.data })
  res.status(200).end()
})
app.patch('/productivity', async (req, res) => {
  const data = await getCached('productivity')
  await setCached('productivity', _.merge(data, req.body.data))
  res.status(200).end()
})

app.get('/throughput/:id', async (req, res) => {
  const { id } = req.params
  const data = await getCached('throughput')

  if (data && data[id]) res.json({ [id]: data[id] })

  else res.json(null)
})
app.post('/throughput', async (req, res) => {
  const data = await getCached('throughput')
  const newdata = _.extend(data, req.body.data)
  await setCached('throughput', newdata)
  res.status(200).end()
})
app.patch('/throughput', async (req, res) => {
  const data = await getCached('throughput')
  await setCached('throughput', _.merge(data, req.body.data))
  res.status(200).end()
})

app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
