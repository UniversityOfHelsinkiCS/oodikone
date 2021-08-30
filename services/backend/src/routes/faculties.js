const router = require('express').Router()
const { faculties } = require('../services/organisations')

router.get('/', async (req, res) => {
  const facultyList = await faculties()
  res.json(facultyList)
})

module.exports = router
