const router = require('express').Router()
const axios = require('axios')

router.get('/', async (req, res) => {
  const result = await axios.get('https://api.github.com/repos/UniversityOfHelsinkiCS/oodikone/releases')
  const formattedResult = result.data.map(r => ({ description: r.body, time: r.created_at, title: r.name }))
  res.status(200).send(formattedResult)
})

module.exports = router
