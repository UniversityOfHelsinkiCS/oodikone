const router = require('express').Router()

const { getCloseToGraduationData } = require('../services/populations/closeToGraduation')

router.get('/', async (_req, res) => {
  const result = await getCloseToGraduationData()
  res.json(result)
})

module.exports = router
