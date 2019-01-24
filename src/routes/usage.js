const router = require('express').Router()
const UsageStatistics = require('../services/usageStatistics')

router.get('/', async (req, res) => {
  const from = req.query.from || 1
  const to = req.query.to || Number((new Date().getTime() / 1000 + 60).toFixed(0))
  const results = await UsageStatistics.between(from, to)
  res.json(results)
})

module.exports = router