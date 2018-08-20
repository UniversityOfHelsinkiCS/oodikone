const router = require('express').Router()
const { getAllProviders } = require('../services/providers')

router.get('/providers', async (req, res) => {
  const providers = await getAllProviders()
  res.json(providers)
})

module.exports = router