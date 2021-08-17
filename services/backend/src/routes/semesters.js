const router = require('express').Router()
const { getSemestersAndYears } = require('../servicesV2/semesters')

router.get('/semesters/codes', async (req, res) => {
  const providers = await getSemestersAndYears()
  res.json(providers)
})

router.use('*', (req, res, next) => next())

module.exports = router
