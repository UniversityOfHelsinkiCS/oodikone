const router = require('express').Router()
const { addExcludedCourses, removeExcludedCourses } = require('../services/excludedCourses')

router.delete('/v3/course_exclusions/:code', async (req, res) => {
  const { code: programmeCode } = req.params
  const { curriculumVersion, courseCodes } = req.body
  const result = await removeExcludedCourses({ programmeCode, curriculumVersion, courseCodes })
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

router.post('/v3/course_exclusions/:code', async (req, res) => {
  const { code } = req.params
  const { courseCodes, curriculumVersion } = req.body
  const result = await addExcludedCourses(code, courseCodes, curriculumVersion.join(','))
  if (!result) {
    res.status(400).end()
    return
  }
  res.json(result)
})

module.exports = router
