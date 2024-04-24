const router = require('express').Router()
const { getCoursesAndModules, getCurriculumVersions } = require('../services/programmeModules')

router.get('/v3/curriculum-options/:code', async (req, res) => {
  const { code } = req.params
  const result = await getCurriculumVersions(code)
  res.json(result)
})

router.get('/v3/curriculum/:code/:periodIds', async (req, res) => {
  const { code, periodIds } = req.params
  const result = await getCoursesAndModules(code, periodIds.replace(' ', '').split(','))
  res.json({
    defaultProgrammeCourses: result.defaultProgrammeCourses.courses,
    defaultProgrammeModules: result.defaultProgrammeCourses.modules,
    secondProgrammeCourses: result.secondProgrammeCourses?.courses,
    secondProgrammeModules: result.secondProgrammeCourses?.modules,
  })
})

module.exports = router
