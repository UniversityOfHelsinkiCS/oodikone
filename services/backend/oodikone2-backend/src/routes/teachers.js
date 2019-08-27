const teachers = require('../services/teachers')
const topteachers = require('../services/topteachers')
const r = require('./router').routerWithWrapper()
const { FEATURES } = require('../conf-backend')
const { mapToProviders } = require('../util/utils')

const router = FEATURES.ERROR_HANDLER ? r.wrapper : r.router

router.get('/', async (req, res) => {
  const { searchTerm } = req.query
  const result = await teachers.bySearchTerm(searchTerm)
  res.json(result)
})

router.get('/top', async (req, res) => {
  const { yearcode, category = topteachers.ID.ALL } = req.query
  if (!yearcode) {
    return res.status(422).send('Missing required yearcode query param')
  }
  const result = await topteachers.getTeacherStats(category, yearcode)
  res.json(result)
})

router.post('/top', async (req, res) => {
  const { startyearcode, endyearcode } = req.body
  res.status(200).end()
  await topteachers.findAndSaveTeachers(startyearcode, endyearcode)
})

router.get('/top/categories', async (req, res) => {
  const result = await topteachers.getCategoriesAndYears()
  res.json(result)
})

router.get('/stats', async (req, res) => {
  const { rights, roles } = req

  const { providers, semesterStart, semesterEnd } = req.query
  if (!providers || !semesterStart) {
    return res.status(422).send('Missing required query parameters.')
  }
  const providerRights = mapToProviders(rights)

  if (!(providers.every(p => providerRights.includes(p)) || roles.includes('admin'))) {
    return res.status(403).send('You do not have rights to see this data')
  }
  const result = await teachers.yearlyStatistics(providers, semesterStart, semesterEnd||semesterStart + 1)
  res.json(result)
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const result = await teachers.teacherStats(id)
  if (!result) {
    return res.status(404).send()
  }
  res.json(result)
})

module.exports = r.router