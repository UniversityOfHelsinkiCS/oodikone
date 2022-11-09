const router = require('express').Router()
var moment = require('moment-timezone')
const { getCustomOpenUniCourses } = require('../services/openUni/openUniStats')

// Method POST used insead of GET because of the possible huge amount of the course_codes
router.post('/', async (req, res) => {
  const courseCodes = req.body?.courselist || []
  const zone = 'EET'
  const startdate = req.body?.startdate
    ? moment.tz(req.body?.startdate, zone).format()
    : moment('01-08-2017 00:00:00', 'DD-MM-YYYY')
  const enddate = req.body?.enddate ? moment.tz(req.body?.enddate, zone).format() : moment().endOf('day')

  if (!courseCodes) return res.status(400).json({ error: 'Courses missing' }).end()
  if (!Array.isArray(courseCodes)) res.status(400).json({ error: 'Courses must be of type array' }).end()
  const customOpenUniSearches = await getCustomOpenUniCourses(courseCodes, startdate, enddate)
  res.json(customOpenUniSearches)
})

module.exports = router
