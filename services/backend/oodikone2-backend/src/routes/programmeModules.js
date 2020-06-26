const router = require('express').Router()
const {
  byProgrammeCode,
  addExcludedCourse,
  removeExcludedCourse,
  modulesByProgrammeCode
} = require('../servicesV2/programmeModules')

router.get('/v3/programme_modules/:code', async (req, res) => {
  const { code } = req.params
  const module = await byProgrammeCode(code)
  res.json(module)
})

router.get('/v3/programme_modules/:code/modules', async (req, res) => {
  const { code } = req.params
  const result = await modulesByProgrammeCode(code)
  res.json(result)
})

router.delete('/v3/programme_modules', async (req, res) => {
  const { programmecode, id } = req.body
  try {
    await removeExcludedCourse(id)
    const result = await byProgrammeCode(programmecode)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.json(500).json(e)
  }
})

router.post('/v3/programme_modules/:programmecode/:coursecode', async (req, res) => {
  const { programmecode, coursecode } = req.body
  try {
    await addExcludedCourse(programmecode, coursecode)
    const result = await byProgrammeCode(programmecode)
    res.json(result)
  } catch (e) {
    console.log(e)
    res.json(500).json(e)
  }
})

module.exports = router
