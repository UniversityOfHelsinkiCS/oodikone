const router = require('express').Router()
const {
  byProgrammeCode,
  addExcludedCourses,
  removeExcludedCourses,
  modulesByProgrammeCode,
} = require('../services/programmeModules')

router.get('/v3/programme_modules/:code', async (req, res) => {
  const { code } = req.params
  const module = await byProgrammeCode(code)
  if (!module) {
    res.status(400).end()
    return
  }
  res.json(module)
})

router.get('/v3/programme_modules/:code/modules', async (req, res) => {
  const { code } = req.params
  const result = await modulesByProgrammeCode(code)
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

router.delete('/v3/programme_modules', async (req, res) => {
  const { programmecode, ids } = req.body
  await removeExcludedCourses(ids)
  const result = await byProgrammeCode(programmecode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

router.post('/v3/programme_modules/:programmecode/', async (req, res) => {
  const { programmecode, coursecodes } = req.body
  await addExcludedCourses(programmecode, coursecodes)
  const result = await byProgrammeCode(programmecode)
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

module.exports = router
