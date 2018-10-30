const { router, wrapper } = require('./router').routerWithWrapper()
const oodilearn = require('../services/oodilearn')

wrapper.get('/oodilearn/ping', async (req, res) => {
  const result = await oodilearn.ping()
  res.json(result.data)
})

wrapper.get('/oodilearn/student/:id', async (req, res) => {
  res.status(404).send('Student not found')
})

module.exports = router
