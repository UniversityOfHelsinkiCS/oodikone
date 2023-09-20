const router = require('express').Router()
const { getCoursesAndModules, getCurriculumVersions } = require('../services/programmeModules')
const { addExcludedCourses, removeExcludedCourses } = require('../services/excludedCourses')

router.get('/v3/programme_modules/:code', async (req, res) => {
  const { code } = req.params
  const result = await getCoursesAndModules(code)
  res.json({
    defaultProgrammeCourses: result.defaultProgrammeCourses.courses,
    secondProgrammeCourses: result.secondProgrammeCourses?.courses,
  })
})

router.get('/v3/programme_modules/:code/modules', async (req, res) => {
  const { code } = req.params
  const result = await getCoursesAndModules(code)
  res.json(result)
})

router.delete('/v3/programme_modules', async (req, res) => {
  const { programmeCode, curriculumVersion, courseCodes } = req.body
  const result = await removeExcludedCourses({ programmeCode, curriculumVersion, courseCodes })
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

router.post('/v3/programme_modules/:programmecode/', async (req, res) => {
  const { excludeFromProgramme, coursecodes, curriculum } = req.body
  const result = await addExcludedCourses(excludeFromProgramme, coursecodes, curriculum.join(','))
  if (!result) {
    res.status(400).end()
    return
  }
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
    secondProgrammeCourses: result.secondProgrammeCourses?.courses,
  })
})

module.exports = router
