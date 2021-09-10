const router = require('express').Router()
const { getImporterClient } = require('../util/importerClient')
const { logger } = require('../util/logger')

router.get('/', async (req, res) => {
  const {
    decodedToken: { uid, sisPersonId },
  } = req
  if (!sisPersonId) {
    logger.error(`User ${uid} tried to get person groups but personId was ${sisPersonId} in header`)
    return res.status(400).json({ error: 'Not possible to get groups without personId header' })
  }
  const importerClient = getImporterClient()
  const { data } = await importerClient.get(`/person-groups/person/${sisPersonId}`)
  return res.json(Object.values(data))
})

module.exports = router
