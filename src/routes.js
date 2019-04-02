const router = require('express').Router()
const bodyParser = require('body-parser')
const logger = require('./util/logger')
const { between } = require('./usageService')

router.use(bodyParser.json())

router.get('/ping', async (req, res) => {
  res.json({ data: 'pong' })
})

router.get('/log', async (req, res) => {
  try {
    const from = req.query.from || 1
    const to = req.query.to || Number((new Date().getTime() / 1000 + 60).toFixed(0))
    const results = await between(from, to)
    res.json(results)
  } catch(e) {
    console.log('error retrieving logs, msg: ', e.message)
  }
})

router.post('/log', async (req, res) => {
  logger.info(req.body.message, req.body.meta)
  res.status(201)
})

router.get('*', async (req, res) => {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

module.exports = router
