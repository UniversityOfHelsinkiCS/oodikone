const router = require('express').Router()
const UsageService = require('../services/usageService')

router.get('/', async (req, res) => {
  const from = req.query.from || 1
  const to = req.query.to || Number((new Date().getTime() / 1000 + 60).toFixed(0))
  const results = await UsageService.get(from, to)
  res.json(results)
})

module.exports = router