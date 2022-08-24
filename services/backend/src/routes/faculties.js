const router = require('express').Router()
const { faculties } = require('../services/organisations')
const { combineFacultyBasics } = require('../services/faculty/facultyBasics')
const { combineFacultyCredits } = require('../services/faculty/facultyCredits')
const { findFacultyProgrammeCodes } = require('../services/faculty/faculty')
const { combineFacultyThesisWriters } = require('../services/faculty/facultyThesisWriters')
const {
  getFacultyProgrammes,
  setFacultyProgrammes,
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
} = require('../services/faculty/facultyService')

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

const getProgrammes = async code => {
  const programmes = await getFacultyProgrammes(code)
  if (programmes) return programmes
  let updatedProgrammes = await findFacultyProgrammeCodes(code)
  if (updatedProgrammes) updatedProgrammes = await setFacultyProgrammes(code, updatedProgrammes)
  return updatedProgrammes
}

router.get('/faculties', async (req, res) => {
  const facultyList = await faculties()
  res.json(facultyList)
})

router.get('/faculties/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type

  if (!code) return res.status(422).end()

  const data = await getBasicStats(code, yearType)
  if (data) return res.json(data)

  const programmes = await getProgrammes(code)
  if (!programmes) return res.status(422).end()

  let updatedStats = await combineFacultyBasics(code, programmes.data, yearType)
  if (updatedStats) {
    updatedStats = await setBasicStats(updatedStats, yearType)
  }
  return res.json(updatedStats)
})

router.get('/faculties/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = 'SPECIAL_INCLUDED' // req.query?.special_groups

  if (!code) return res.status(422).end()

  const data = await getCreditStats(code, yearType)
  if (data) return res.json(data)

  const programmes = await getProgrammes(code)
  if (!programmes) return res.status(422).end()

  let updatedStats = await combineFacultyCredits(code, programmes.data, yearType, specialGroups)
  if (updatedStats) {
    updatedStats = await setCreditStats(updatedStats, yearType)
  }

  return res.json(updatedStats)
})

router.get('/faculties/:id/thesisstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  //const specialGroups = 'SPECIAL_INCLUDED'
  if (!code) return res.status(422).end()

  let allThesisWriters = {
    id: code,
    years: [],
    tableStats: [],
    graphStats: [],
    programmeTableStats: {},
    titles: ['', 'All thesis writers', 'Bachelors', 'Masters', 'Doctors', 'Others'],
    programmeNames: {},
    status: 'Done',
    lastUpdated: '',
  }

  const programmes = await getProgrammes(code)
  if (programmes) {
    await combineFacultyThesisWriters(allThesisWriters, programmes.data, code, yearType)
  }

  return res.json(allThesisWriters)
})

router.get('/faculties/:id/graduationtimes', async (req, res) => {
  const code = req.params.id
  const mode = req.query?.mode
  const excludeOld = req.query?.excludeOld

  if (!code) return res.status(422).end()

  if (mode === 'all') {
    // find times for faculty and individual programmes
    if (excludeOld) {
      // don't count for old programmes
    }
  } else {
    // just faculty-wide average in enough
  }

  const programmes = await getProgrammes(code)
  return res.json(programmes.data)
})

module.exports = router
