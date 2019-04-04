const router = require('express').Router()
const { subscribe } = require('../services/tasks')

router.get('/status/topteachers', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
  subscribe(message => {
    res.write(`data: ${JSON.stringify(message)}`)
    res.write('\n\n')
  })
})

module.exports = router