const router = require('express').Router()
const { getSemestersAndYears } = require('../services/semesters')

router.get('/semesters/codes', async(req, res) => {
  const before = new Date()
  const providers = await getSemestersAndYears(before)
  res.json(providers)
})

module.exports = router