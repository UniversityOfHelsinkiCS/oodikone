const router = require('express').Router()
const SisCourse = require('../servicesV2/courses')
const OodiCourse = require('../services/courses')
const diff = require('../services/diff')
const logger = require('../util/logger')

router.get('/diff/courseyearlystats', async (req, res) => {
  try {
    const { roles } = req
    const admin = roles && roles.includes('admin')
    if (!admin) {
      return res.status(403).json({ error: 'No access to course stats diff' })
    }
    const { codes, separate: sep, unifyOpenUniCourses: unify } = req.query

    const separate = !sep ? false : JSON.parse(sep)
    const unifyOpenUniCourses = !unify ? false : JSON.parse(unify)
    if (!codes) {
      res.status(422).send('Missing required query parameters')
    } else {
      const oodiResults = await OodiCourse.courseYearlyStats(codes, separate, unifyOpenUniCourses)
      const sisResults = await SisCourse.courseYearlyStats(codes, separate, unifyOpenUniCourses)
      const result = diff.getCourseYearlyStatsDiff(sisResults, oodiResults)
      res.json(result)
    }
  } catch (e) {
    logger.error(e.message)
    console.log(e)
    res.status(500).send('Something went wrong with handling the request.')
  }
})

module.exports = router
