const router = require('express').Router()
const axios = require('axios')
const changelog = {}

router.get('/', async (req, res) => {
  if (changelog?.data) return res.status(200).send(changelog.data)
  const result = await axios.get('https://api.github.com/repos/UniversityOfHelsinkiCS/oodikone/releases')
  const formattedResult = result.data.map(r => ({ description: r.body, time: r.created_at, title: r.name }))
  changelog.data = formattedResult
  res.status(200).send(formattedResult)
})

module.exports = router
