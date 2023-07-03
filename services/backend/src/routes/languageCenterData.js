const router = require('express').Router()
const { getLanguageCenterData } = require('../services/languageCenterData')

router.get('/', async (req, res) => {
  const result = await getLanguageCenterData()
  return res.json(result)
})

module.exports = router
