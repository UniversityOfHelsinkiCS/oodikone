const router = require('express').Router()
const { byProgrammeCode } = require('../servicesV2/programmeModules')

router.get('/v3/programme_modules/:code', async (req, res) => {
  const { code } = req.params
  const module = await byProgrammeCode(code)
  res.json(module)
})

module.exports = router
