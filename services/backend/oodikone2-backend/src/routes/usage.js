const router = require('express').Router()
const UsageService = require('../services/usageService')

const S_TO_MS = 1000

router.get('/', async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(1 * S_TO_MS)
  const to = req.query.to ? new Date(req.query.to) : new Date(new Date().getTime() + 60 * S_TO_MS)
  const resultStream = await UsageService.getStream(from, to)
  res.contentType('json')
  resultStream.pipe(res)
})

module.exports = router
