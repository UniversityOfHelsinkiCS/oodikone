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

wrapper.get('/oodilearn/student', async (req, res) => {
  const { searchTerm } = req.query
  if (!searchTerm) {
    return res.status(400).send('Missing searchTerm query parameter')
  } else {
    const matches = await oodilearn.matchingStudents(searchTerm)
    return res.json(matches)
  }
})

module.exports = router
