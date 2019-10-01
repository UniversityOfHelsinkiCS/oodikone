const router = require('express').Router()
const bodyParser = require('body-parser')
const usageLogger = require('./util/usageLogger')
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
  } catch (e) {
    res.status(500).send(e.message)
    logger.error('error retrieving logs', e)
  }
})

router.post('/log', async (req, res) => {
  try {
    await usageLogger.info(req.body.message, req.body.meta)
    res.status(201).end()
  } catch (e) {
    res.status(500).send(e.message)
    logger.error('error saving logs', e)
  }
})

router.get('*', async (req, res) => {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

module.exports = router
