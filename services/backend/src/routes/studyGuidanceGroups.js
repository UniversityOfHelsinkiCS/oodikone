const router = require('express').Router()
const { getImporterClient } = require('../util/importerClient')

router.get('/', async (req, res) => {
  const personId = req.headers.hypersonsisuid
  if (!personId) {
    const errorMessage = 'Not possible to get groups without personId header'
    console.log(errorMessage)
    return res.status(400).json({ error: errorMessage })
  }
  const importerClient = getImporterClient()
  try {
    const { data } = await importerClient.get(`/person-groups/person/${personId}`)
    return res.json(Object.values(data))
  } catch (e) {
    console.log(e)
    return res.status(500).json(e)
  }
})

module.exports = router
