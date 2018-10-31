const { router, wrapper } = require('./router').routerWithWrapper()
const oodilearn = require('../services/oodilearn')

wrapper.get('/oodilearn/ping', async (req, res) => {
  const result = await oodilearn.ping()
  res.json(result.data)
})

wrapper.get('/oodilearn/student/:id', async (req, res) => {
  const result = await oodilearn.getStudentData(req.params.id)
  res.status(200).json(result.data)
})

module.exports = router
