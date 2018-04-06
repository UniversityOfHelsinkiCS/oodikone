const router = require('express').Router()
const Student = require('../services/students')

router.get('/students', async (req, res) => {
  let results = []
  if (req.query.searchTerm) {
    results = await Student.bySearchTerm(req.query.searchTerm)
  }

  res.json(results)
})

router.get('/students/:id', async (req, res) => {
  const results = await Student.withId(req.params.id)
  res.json(results)
})

module.exports = router
