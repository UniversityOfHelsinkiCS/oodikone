const router = require('express').Router()

const { isFaculty, providersOfFaculty } = require('../services/organisations')
const { bySearchTerm, yearlyStatistics, teacherStats } = require('../services/teachers')
const { ID, getTeacherStats, findAndSaveTeachers, getCategoriesAndYears } = require('../services/topteachers')
const { getFullStudyProgrammeRights, splitByEmptySpace } = require('../util')
const { mapToProviders } = require('../util/map')

router.get('/', async (req, res) => {
  const { searchTerm } = req.query
  if (!searchTerm) return res.status(400).json({ error: 'searchTerm missing' })

  const trimmedSearchTerm = searchTerm.trim()
  if (
    !splitByEmptySpace(trimmedSearchTerm).find(t => t.length >= 4) ||
    (Number(trimmedSearchTerm) && trimmedSearchTerm.length < 6)
  ) {
    return res.status(400).json({ error: 'invalid searchTerm' })
  }

  const result = await bySearchTerm(trimmedSearchTerm)
  res.json(result)
})

router.get('/top', async (req, res) => {
  const { yearcode, category = ID.ALL } = req.query
  if (!yearcode) {
    return res.status(422).send('Missing required yearcode query param')
  }

  const result = await getTeacherStats(category, yearcode)
  res.json(result)
})

router.post('/top', async (req, res) => {
  const { startyearcode, endyearcode } = req.body
  res.status(200).end()
  await findAndSaveTeachers(startyearcode, endyearcode)
})

router.get('/top/categories', async (_req, res) => {
  const result = await getCategoriesAndYears()
  res.json(result)
})

router.get('/stats', async (req, res) => {
  const {
    user: { roles, programmeRights },
  } = req

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  const { providers, semesterStart, semesterEnd } = req.query
  if (!providers || !semesterStart) {
    return res.status(422).send('Missing required query parameters.')
  }
  const providerRights = mapToProviders(fullStudyProgrammeRights)

  if (!(providers.every(provider => providerRights.includes(provider)) || roles.includes('admin'))) {
    return res.status(403).send('You do not have rights to see this data')
  }

  // combine provider list that may include programmes and faculties
  const parsedProviders = [
    ...new Set(
      await providers.reduce(
        async (acc, curr) =>
          isFaculty(curr) ? [...(await acc), ...(await providersOfFaculty(curr))] : [...(await acc), curr],
        []
      )
    ),
  ]

  const result = await yearlyStatistics(parsedProviders, semesterStart, semesterEnd || semesterStart + 1)
  res.json(result)
})

router.get('/:id', async (req, res) => {
  const { id } = req.params
  const result = await teacherStats(id)
  if (!result) {
    return res.status(404).send()
  }
  res.json(result)
})

module.exports = router
