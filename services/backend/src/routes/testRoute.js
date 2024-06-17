const router = require('express').Router()

const { CreditType } = require('../models/creditType.ts')

router.get('/', async (req, res) => {
  const result = await CreditType.findAll({})
  return res.send(result)
})

module.exports = router
