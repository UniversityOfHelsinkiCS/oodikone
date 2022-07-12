const router = require('express').Router()
const crypto = require('crypto')
const Course = require('../services/courses')
const { validateParamLength } = require('../util')

router.get('/v2/coursesmulti', async (req, res) => {
  let results = { courses: [] }
  const { name, code } = req.query

  if (!(validateParamLength(name, 5) || validateParamLength(code, 2))) {
    return res.status(400).json({ error: 'name or code invalid' })
  }

  results = await Course.byNameAndOrCodeLike(name, code)
  res.json(results)
})

router.get('/v3/courseyearlystats', async (req, res) => {
  const {
    user: { rights, roles },
  } = req

  const allowedRoles = roles && ['admin', 'courseStatistics'].find(role => roles.includes(role))

  // If user has rights to see at least one programme, then they are allowed
  // to see all of them
  if (!allowedRoles && rights.length < 1) {
    return res.status(403).json({ error: 'No programmes so no access to course stats' })
  }

  const { codes, separate: sep } = req.query

  const separate = !sep ? false : JSON.parse(sep)
  if (!codes) {
    res.status(422).send('Missing required query parameters')
  } else {
    // Studentnumbers should be obfuscated to all other users except admins
    // and users with rights to any specific study programmes
    const anonymize = allowedRoles !== 'admin' && rights.length < 1
    const anonymizationSalt = anonymize ? crypto.randomBytes(12).toString('hex') : null
    const results = await Course.courseYearlyStats(codes, separate, anonymizationSalt)
    res.json(results)
  }
})

module.exports = router
