const router = require('express').Router()
const bodyParser = require('body-parser')
const logSaver = require('../util/logSaver')
const logger = require('../util/logger')

router.use(bodyParser.json())

router.get('/ping', async (req, res) => {
  res.json({ data: 'pong' })
})

router.post('/log', async (req, res) => {
  logger.info(req.body.message, req.body.meta)
  res.json({ data: 'pong' })
})

router.get('*', async (req, res) => {
  const results = { error: 'unknown endpoint' }
  res.status(404).json(results)
})

module.exports = router
