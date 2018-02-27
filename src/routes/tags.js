const router = require('express').Router()
const Tag = require('../services/tags')

router.get('/tags', async function (req, res) {
  const results = await Tag.bySearchTerm(req.query.query || '')
  res.json(results)
})

router.post('/tags/:tagname', async function (req, res) {
  const tagname = req.params.tagname
  const students = req.body
  const results = await Tag.addToStudents(tagname, students)
  const status = results.error === undefined ? 201 : 400

  res.status(status).json(results)
})

module.exports = router
