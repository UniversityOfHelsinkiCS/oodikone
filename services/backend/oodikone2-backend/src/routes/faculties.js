const router = require('express').Router()
const { all } = require('../services/organisations')

router.get('/', async (req, res) => {
  const faculties = await all()
  res.json(faculties)
})

module.exports = router
