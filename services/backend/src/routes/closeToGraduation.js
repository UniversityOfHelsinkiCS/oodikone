const { getStudentsCloseToGraduation } = require('../services/populations')

const router = require('express').Router()

router.get('/', async (req, res) => {
  const result = await getStudentsCloseToGraduation()
  res.status(200).json(result)
})

module.exports = router
