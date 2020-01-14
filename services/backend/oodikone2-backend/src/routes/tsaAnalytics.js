const Sentry = require('@sentry/node')
const router = require('express').Router()
const tsaService = require('../services/tsaService')

router.post('/event', (req, res) => {
  const { group, name, label, value } = req.body

  if (!group || !name || !value) {
    return res.status(400).json({ error: 'group, name and value are required' })
  }

  // don't await here because frontend doesn't care if it succeeds
  tsaService.sendTsaEvent(req.decodedToken.userId, { group, name, label, value }).catch(e => {
    Sentry.withScope(scope => {
      // if error was caused by a 400, dig out the JSON response for Sentry
      if (e.isAxiosError && e.response && e.response.data) {
        scope.setExtra({ error: e.response.data })
      }

      Sentry.captureException(e)
    })
  })

  res.status(200).end()
})

module.exports = router
