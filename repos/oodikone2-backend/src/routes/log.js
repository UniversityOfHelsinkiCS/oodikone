const router = require('express').Router()
const logger = require('../util/logger')

router.post('/log', async (req, res) => {
  logger.error(req.body.message, req.body['full_message'])
  res.status(200).end()
})

module.exports = router
