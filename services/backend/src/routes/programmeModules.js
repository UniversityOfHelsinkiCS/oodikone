const router = require('express').Router()
const { getCoursesAndModules, getCurriculumVersions } = require('../services/programmeModules')

router.get('/v3/programme_modules/:code/modules', async (req, res) => {
  const { code } = req.params
  const result = await getCoursesAndModules(code)
  res.json(result)
})

router.get('/v3/programme_modules/get_curriculum_options/:code', async (req, res) => {
  const { code } = req.params
  const result = await getCurriculumVersions(code)
  res.json(result)
})

router.get('/v3/programme_modules/get_curriculum/:code/:period_ids', async (req, res) => {
  const { code, period_ids } = req.params
  const result = await getCoursesAndModules(code, period_ids.replace(' ', '').split(','))
  res.json({
    defaultProgrammeCourses: result.defaultProgrammeCourses.courses,
    defaultProgrammeModules: result.defaultProgrammeCourses.modules,
    secondProgrammeCourses: result.secondProgrammeCourses?.courses,
    secondProgrammeModules: result.secondProgrammeCourses?.modules,
  })
})

module.exports = router
