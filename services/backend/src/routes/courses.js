const router = require('express').Router()
const crypto = require('crypto')
const courseService = require('../services/courses')
const { faculties } = require('../services/organisations')
const { validateParamLength } = require('../util')
const { getFullStudyProgrammeRights } = require('../util/utils')

router.get('/v2/coursesmulti', async (req, res) => {
  let results = { courses: [] }
  const { name, code, combineSubstitutions } = req.query

  if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
    return res.status(400).json({ error: 'name or code invalid' })
  }

  results = await courseService.byNameAndOrCodeLike(name, code)

  if (combineSubstitutions === 'false') {
    const courseCodes = results.courses.map(course => course.code)

    const substitutions = [
      ...new Set(
        results.courses
          .flatMap(course => course.substitutions)
          .filter(value => value !== null && !courseCodes.includes(value))
      ),
    ]
    const substitutionDetails = await courseService.byCodes(substitutions)
    for (const substitution of substitutionDetails) {
      results.courses.push(substitution.dataValues)
    }
  }
  res.json(results)
})

router.get('/v3/courseyearlystats', async (req, res) => {
  const {
    user: { roles, programmeRights },
  } = req

  const allowedRoles = roles && ['admin', 'courseStatistics'].find(role => roles.includes(role))
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  // If user has rights to see at least one programme, then they are allowed
  // to see all of them
  if (!allowedRoles && fullStudyProgrammeRights.length === 0) {
    return res.status(403).json({ error: 'No programmes so no access to course stats' })
  }

  const { codes, separate: sep } = req.query
  const combineSubstitutions = req.query.combineSubstitutions !== 'false'

  const separate = !sep ? false : JSON.parse(sep)
  if (!codes) {
    res.status(422).send('Missing required query parameters')
  } else {
    // Studentnumbers should be obfuscated to all other users except admins
    // and users with rights to any specific study programmes
    const anonymize = allowedRoles !== 'admin' && fullStudyProgrammeRights.length === 0
    const anonymizationSalt = anonymize ? crypto.randomBytes(12).toString('hex') : null
    const results = await courseService.courseYearlyStats(codes, separate, anonymizationSalt, combineSubstitutions)
    res.json(results)
  }
})

router.get('/faculties-only', async (_req, res) => {
  const facultyList = await faculties()
  res.json(facultyList)
})

module.exports = router
