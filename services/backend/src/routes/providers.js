const router = require('express').Router()
const { getAllProviders } = require('../services/providers')

router.get('/providers', async (_req, res) => {
  const providers = await getAllProviders()
  res.json(providers)
})

module.exports = router
