const router = require('express').Router()

const { getSemestersAndYears } = require('../services/semesters')

router.get('/', async (_req, res) => {
  const providers = await getSemestersAndYears()
  res.json(providers)
})

module.exports = router
