const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const {
  Productivity,
  Throughput,
  FacultyStats,
  NonGraduatedStudents,
  ProductivityV2,
  ThroughputV2,
  NonGraduatedStudentsV2
} = require('./src/models')
const { initializeDatabaseConnection } = require('./src/database/connection')

const v2Routes = app => {
  const formatProductivity = stats => {
    const { id, updatedAt: lastUpdated, data, status } = stats
    return { [id]: { lastUpdated, data, status } }
  }

  const formatThroughput = stats => {
    const { id, updatedAt: lastUpdated, data, status } = stats
    return { [id]: { lastUpdated, data: data.years, status, totals: data.totals, stTotals: data.stTotals } }
  }

  app.get('/v2/productivity/:id', async (req, res) => {
    const { id } = req.params
    const result = await ProductivityV2.findByPk(id)
    if (!result) {
      res.json(null)
    } else {
      res.json(formatProductivity(result))
    }
  })

  app.post('/v2/productivity', async (req, res) => {
    const { data } = req.body
    const [saved] = await ProductivityV2.upsert({ ...data, status: 'DONE' }, { returning: true })
    const result = formatProductivity(saved)
    res.json(result)
  })

  app.patch('/v2/productivity', async (req, res) => {
    for (let [id, data] of Object.entries(req.body.data)) {
      await ProductivityV2.upsert({ ...data, id })
    }
    res.status(200).end()
  })

  app.get('/v2/throughput/:id', async (req, res) => {
    const { id } = req.params
    const result = await ThroughputV2.findByPk(id)
    if (!result) {
      res.json(null)
    } else {
      res.json(formatThroughput(result))
    }
  })

  app.post('/v2/throughput', async (req, res) => {
    const { data } = req.body
    const [saved] = await ThroughputV2.upsert({ ...data, status: 'DONE' }, { returning: true })
    const result = formatThroughput(saved)
    res.json(result)
  })

  app.patch('/v2/throughput', async (req, res) => {
    for (let [id, data] of Object.entries(req.body.data)) {
      await ThroughputV2.upsert({ ...data, id })
    }
    res.status(200).end()
  })

  app.patch('/v2/nongraduatedstudents', async (req, res) => {
    for (let [id, data] of Object.entries(req.body.data)) {
      await NonGraduatedStudentsV2.upsert({ data, id })
    }
    res.status(200).end()
  })

  app.get('/v2/nongraduatedstudents/:id', async (req, res) => {
    const { id } = req.params
    const result = await NonGraduatedStudentsV2.findByPk(id)
    if (!result) {
      res.json(null)
    } else {
      res.json(result)
    }
  })
}

initializeDatabaseConnection()
  .then(() => {
    const app = express()
    const port = 4568

    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(morgan('tiny'))

    app.get('/ping', (req, res) => res.json({ message: 'pong' }))

    const formatProductivity = stats => {
      const { id, updatedAt: lastUpdated, data, status } = stats
      return { [id]: { lastUpdated, data, status } }
    }

    const formatThroughput = stats => {
      const { id, updatedAt: lastUpdated, data, status } = stats
      return { [id]: { lastUpdated, data: data.years, status, totals: data.totals, stTotals: data.stTotals } }
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

    app.get('/nongraduatedstudents/:id', async (req, res) => {
      const { id } = req.params
      const result = await NonGraduatedStudents.findByPk(id)
      if (!result) {
        res.json(null)
      } else {
        res.json(result)
      }
    })

    app.patch('/nongraduatedstudents', async (req, res) => {
      for (let [id, data] of Object.entries(req.body.data)) {
        await NonGraduatedStudents.upsert({ data, id })
      }
      res.status(200).end()
    })

    v2Routes(app)

    const server = app.listen(port, () => console.log(`Analytics listening on port ${port}!`))
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
