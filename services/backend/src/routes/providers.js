const router = require('express').Router()
const { getAllProviders } = require('../servicesV2/providers')

router.get('/providers', async (req, res) => {
  const providers = await getAllProviders()
  res.json(providers)
})

module.exports = router
