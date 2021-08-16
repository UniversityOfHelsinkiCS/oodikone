const router = require('express').Router()
const { faculties } = require('../servicesV2/organisations')

router.get('/', async (req, res) => {
  const facultyList = await faculties()
  console.log('faculties')
  res.json(facultyList)
})

module.exports = router
