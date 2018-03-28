const router = require('express').Router()
const Student = require('../services/students')

router.get('/students', async function (req, res) {
  let results = []
  if (req.query.searchTerm) {
    results = await Student.bySearchTerm(req.query.searchTerm)
  }

  res.json(results)
})

router.get('/students/:id', async function (req, res) {
  const results = await Student.withId(req.params.id)
  res.json(results)
})

router.post('/students/:id/tags', async function (req, res) {
  const tagname = req.body.tagname
  const result = await Student.addTag(req.body.studentnumber, tagname)
  const status = result.error === undefined ? 201 : 400
  console.log(result.error)

  res.status(status).json(result)
})

router.delete('/students/:id/tags', async function (req, res) {
  const tagname = req.body.tagname
  const result = await Student.deleteTag(req.body.studentnumber, tagname)
  const status = result.error === undefined ? 200 : 400
  res.status(status).json(result)
})

module.exports = router
