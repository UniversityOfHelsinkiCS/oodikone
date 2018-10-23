const { router, wrapper } = require('./router').routerWithWrapper()
const oodilearn = require('../services/oodilearn')

wrapper.get('/oodilearn/ping', async (req, res) => {
  const result = await oodilearn.ping()
  res.json(result.data)
})

module.exports = router
