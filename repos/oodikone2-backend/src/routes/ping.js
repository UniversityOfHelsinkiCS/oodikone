const { router, wrapper } = require('./router').routerWithWrapper()

wrapper.get('/ping', async (req, res) => {
  res.json({})
})

module.exports = router
