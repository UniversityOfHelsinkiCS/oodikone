const Raven = require('raven')
const router = require('express').Router()
const tsaService = require('../services/tsaService')

router.post('/event', (req, res) => {
  const { group, name, label, value } = req.body

  if (!group || !name) {
    return res.status(400).json({ error: 'group and name are required' })
  }

  // don't await here because frontend doesn't care if it succeeds
  tsaService
    .sendTsaEvent(req.decodedToken.userId, { group, name, label, value })
    .catch(e => Raven.captureException(e, { req }))

  res.status(200).end()
})

module.exports = router
