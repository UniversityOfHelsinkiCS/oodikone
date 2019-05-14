const express = require('express')
const _ = require('lodash')
const morgan = require('morgan')
const { Productivity, Throughput } = require('./src/models')

const app = express()
const port = 4568
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(morgan('tiny'))

app.get('/ping', (req, res) => res.json({ message: 'pong'}))

const formatProductivity = stats => {
  const { id, updatedAt: lastUpdated, data, status } = stats
  return { [id] : { lastUpdated, data, status } }
}

const formatThroughput = stats => {
  const { id, updatedAt: lastUpdated, data, status } = stats
  return { [id] : { lastUpdated, data, status } }
}

app.get('/productivity/:id', async (req, res) => {
  const { id } = req.params
  const result = await Productivity.findByPk(id)
  if (!result) {
    res.json(null)
  } else {
    res.json(formatProductivity(result))
  }
})

app.post('/productivity', async (req, res) => {
  const { data } = req.body
  const [saved] = await Productivity.upsert({ ...data, status: 'DONE' }, { returning: true })
  const result = formatProductivity(saved)
  res.json(result)
})

app.patch('/productivity', async (req, res) => {
  for (let [id, data] of Object.entries(req.body.data)) {
    await Productivity.upsert({ ...data, id })  
  }
  res.status(200).end()
})

app.get('/throughput/:id', async (req, res) => {
  const { id } = req.params
  const result = await Throughput.findByPk(id)
  if (!result) {
    res.json(null)
  } else {
    res.json(formatThroughput(result))
  }
})

app.post('/throughput', async (req, res) => {
  const { data } = req.body
  const [saved] = await Throughput.upsert({ ...data, status: 'DONE' }, { returning: true })
  const result = formatThroughput(saved)
  res.json(result)
})

app.patch('/throughput', async (req, res) => {
  for (let [id, data] of Object.entries(req.body.data)) {
    await Throughput.upsert({ ...data, id })  
  }
  res.status(200).end()
})
app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
