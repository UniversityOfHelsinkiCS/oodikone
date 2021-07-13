const router = require('express').Router()
const {
  withErr,
  getProtoC,
  getProtoCProgramme,
  getStatus,
  getUber,
  getStartYears,
  getGraduatedStatus
} = require('../servicesV2/trends')

router.get('/start-years', async (req, res) => {
  const years = await getStartYears()
  res.json(years.map(({ studystartdate }) => studystartdate))
})

router.get(
  '/uber-data',
  withErr(async (req, res) => {
    const data = await getUber(req.query)
    res.json(data)
  })
)

router.get(
  '/proto-c-data-programme',
  withErr(async (req, res) => {
    const data = await getProtoCProgramme(req.query)
    res.json(data)
  })
)

router.get(
  '/proto-c-data',
  withErr(async (req, res) => {
    const data = await getProtoC(req.query)
    res.json(data)
  })
)

router.get(
  '/status-graduated',
  withErr(async (req, res) => {
    const { date: unixMillis, showByYear } = req.query
    const date = new Date(Number(unixMillis))
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    if (isNaN(date.getTime()) || date.getTime() > endOfToday.getTime()) {
      return res.status(400).json({ error: 'Invalid date' })
    }

    // End of day
    date.setHours(23, 59, 59, 999)
    const data = await getGraduatedStatus(date.getTime(), showByYear)
    res.json(data)
  })
)

router.get(
  '/status',
  withErr(async (req, res) => {
    const { date: unixMillis, showByYear } = req.query
    const date = new Date(Number(unixMillis))
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    if (isNaN(date.getTime()) || date.getTime() > endOfToday.getTime()) {
      return res.status(400).json({ error: 'Invalid date' })
    }

    // End of day
    date.setHours(23, 59, 59, 999)
    const status = await getStatus(date.getTime(), showByYear)
    res.json(status)
  })
)

module.exports = router
