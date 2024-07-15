const router = require('express').Router()

const { Credit, CreditType, Studyright } = require('../models/index')

router.get('/', async (req, res) => {
  const credit = await Credit.findOne({ include: [CreditType, Studyright] })
  return res.send(credit)
})

module.exports = router
