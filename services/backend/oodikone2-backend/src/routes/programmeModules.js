const router = require('express').Router()
const { byProgrammeCode, addExcludedCourses, removeExcludedCourses } = require('../servicesV2/programmeModules')

router.get('/v3/programme_modules/:code', async (req, res) => {
  const { code } = req.params
  const module = await byProgrammeCode(code)
  res.json(module)
})

router.delete('/v3/programme_modules', async (req, res) => {
  const { programmecode, ids } = req.body
  try {
    await removeExcludedCourses(ids)
    const result = await byProgrammeCode(programmecode)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.json(500).json(e)
  }
})

router.post('/v3/programme_modules/:programmecode/', async (req, res) => {
  const { programmecode, coursecodes } = req.body
  try {
    await addExcludedCourses(programmecode, coursecodes)
    const result = await byProgrammeCode(programmecode)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.json(500).json(e)
  }
})

module.exports = router
