const { router, wrapper } = require('./router').routerWithWrapper()
const oodilearn = require('../services/oodilearn')
const courses = require('../services/courses')

const AVAILABLE_COURSES = [
  'DIGI-100A',
  'MAT11001',
  'MAT11002',
  'MAT11003',
  'MAT11004',
  'MAT12003',
  'TKT10001',
  'TKT10002',
  'TKT10003',
  'TKT10004',
  'TKT10005',
  'TKT20001',
  'TKT50003'
]

wrapper.get('/ping', async (req, res) => {
  const result = await oodilearn.ping()
  res.json(result.data)
})

wrapper.get('/query', async (req, res) => {
  const result = await oodilearn.query(req.query.query)
  res.json(result.data)
})

wrapper.get('/suggest_course', async (req, res) => {
  const result = await oodilearn.suggestCourse(req.query.doneCourses, req.query.period)
  res.json(result.data)
})

wrapper.get('/suggest_route', async (req, res) => {
  const result = await oodilearn.suggestRoute()
  res.json(result.data)
})

wrapper.get('/student/:id', async (req, res) => {
  const result = await oodilearn.getStudentData(req.params.id)
  res.status(200).json(result.data)
})

wrapper.get('/student', async (req, res) => {
  const { searchTerm } = req.query
  if (!searchTerm) {
    return res.status(400).send('Missing searchTerm query parameter')
  } else {
    const matches = await oodilearn.matchingStudents(searchTerm)
    return res.json(matches)
  }
})

wrapper.get('/courses', async (req, res) => {
  const result = await courses.byCodes(AVAILABLE_COURSES)
  res.json(result)
})

wrapper.get('/populations', async (req, res) => {
  const result = await oodilearn.getPopulations()
  res.json(result)
})

wrapper.get('/populations/:population', async (req, res) => {
  const result = await oodilearn.getPopulation(req.params.population)
  res.json(result)
})

wrapper.get('/:code', async (req, res) => {
  const result = await oodilearn.getCluster(req.params.code)
  res.status(200).json(result.data)
})

wrapper.get('/courses/:id', async (req, res) => {
  const result = await oodilearn.courseGradeData(req.params.id)
  res.json(result)
})

module.exports = router
