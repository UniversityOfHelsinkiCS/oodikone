const { getCloseToGraduationData } = require('../services/populations/closeToGraduation')

const router = require('express').Router()

router.get('/', async (req, res) => {
  const result = await getCloseToGraduationData()
  res.json(result)
})

module.exports = router
