const router = require('express').Router()
const bodyParser = require('body-parser')
const usageLogger = require('./util/usageLogger')
const logger = require('./util/logger')
const { between } = require('./usageService')

router.use(bodyParser.json())

router.get('/ping', async (req, res) => {
  res.json({ data: 'pong' })
})

const S_TO_MS = 1000

router.get('/log', async (req, res) => {
  try {
    const from = req.query.from || new Date(1 * S_TO_MS)
    const to = req.query.to || new Date(new Date().getTime() + 60 * S_TO_MS)
    const results = await between(from, to)
    res.json(results)
  } catch (e) {
    res.status(500).json({ error: e.message })
    logger.error('error retrieving logs', e)
  }
})

router.post('/log', async (req, res) => {
  try {
    await usageLogger.info(req.body.message, {
      ...req.body.meta,
      // pass this as a custom field so we can filter by it in graylog
      isUsageStats: true
    })
    res.status(201).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
    logger.error('error saving logs', e)
  }
})

router.get('*', async (req, res) => {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

module.exports = router
