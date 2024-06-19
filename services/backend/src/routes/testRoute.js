const router = require('express').Router()

const { Credit } = require('../models/credit.ts')
const { CreditType } = require('../models/creditType.ts')
const { Studyright } = require('../models/studyright.ts')

router.get('/', async (req, res) => {
  const credit = await Credit.findOne({ include: [CreditType, Studyright] })
  return res.send(credit)
})

module.exports = router
