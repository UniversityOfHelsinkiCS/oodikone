const router = require('express').Router()
const axios = require('axios')

const { isDev } = require('../conf-backend')

const changelog = {}

router.get('/', async (_req, res) => {
  if (changelog?.data) return res.status(200).send(changelog.data)
  if (isDev)
    return res.status(200).json([
      {
        description: "### Fake release\nLet's not spam the GitHub API in development!",
        title: 'Fake title for fake release',
        time: new Date(),
      },
    ])
  const result = await axios.get('https://api.github.com/repos/UniversityOfHelsinkiCS/oodikone/releases')
  const formattedResult = result.data.map(r => ({ description: r.body, time: r.created_at, title: r.name }))
  changelog.data = formattedResult
  res.status(200).send(formattedResult)
})

module.exports = router
