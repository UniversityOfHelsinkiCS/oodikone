const router = require('express').Router()
const Student = require('../services/students')

router.get('/students', async function (req, res) {
  let results = []
  const uid = req.decodedToken.userId
  if (req.query.searchTerm) {
    results = await Student.bySearchTerm(uid, req.query.searchTerm)
  }

  res.json(results)
})

router.get('/students/:id', async function (req, res) {
  const uid = req.decodedToken.userId
  const results = await Student.withId(uid, req.params.id)
  res.json(results)
})

module.exports = router
