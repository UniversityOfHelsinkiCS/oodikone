const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const { Productivity, Throughput, FacultyStats } = require('./src/models')
const { initializeDatabaseConnection } = require('./src/database/connection')

initializeDatabaseConnection().then(() => {
  const app = express()
  const port = 4568

  app.use(bodyParser.json({ limit: '50mb' }))
  app.use(morgan('tiny'))

  app.get('/ping', (req, res) => res.json({ message: 'pong'}))

  const formatProductivity = stats => {
    const { id, updatedAt: lastUpdated, data, status } = stats
    return { [id] : { lastUpdated, data, status } }
  }

  const formatThroughput = stats => {
    const { id, updatedAt: lastUpdated, data, status } = stats
    return { [id] : { lastUpdated, data: data.years, status, totals: data.totals } }
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

  app.get('/facultystats', async (req, res) => {
    const results = await FacultyStats.findAll()
    res.status(200).json(results)
  })

  app.patch('/facultystats', async (req, res) => {
    for (let [id, data] of Object.entries(req.body.data)) {
      await FacultyStats.upsert({ id, data })
    }
    res.status(200).end()
  })

  const server = app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Process terminated')
    })
  })
}).catch(e => {
  process.exitCode = 1
  console.log(e)
})
