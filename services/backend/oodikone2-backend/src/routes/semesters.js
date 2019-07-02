const router = require('express').Router()
const { getSemestersAndYears } = require('../services/semesters')

router.get('/semesters/codes', async(req, res) => {
  const providers = await getSemestersAndYears()
  res.json(providers)
})

module.exports = router