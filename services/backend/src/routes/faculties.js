const router = require('express').Router()
const { faculties } = require('../services/organisations')
const { combineFacultyBasics } = require('../services/faculty/facultyBasics')
const { combineFacultyCredits } = require('../services/faculty/facultyCredits')
const { findFacultyProgrammeCodes } = require('../services/faculty/faculty') // degreeProgrammesOfFaculty,
const { combineFacultyThesisWriters } = require('../services/faculty/facultyThesisWriters')
const { getFacultyProgrammes, setFacultyProgrammes } = require('../services/faculty/facultyService')

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

const getProgrammes = async code => {
  const programmes = await getFacultyProgrammes(code)
  if (programmes) return programmes.datas
  const updatedProgrammes = await findFacultyProgrammeCodes(code)
  if (updatedProgrammes) await setFacultyProgrammes(code, updatedProgrammes)
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

  let allBasics = {
    id: code,
    years: [],
    programmeNames: {},
    studentInfo: {
      tableStats: [],
      graphStats: [],
      titles: ['', 'Started studying', 'Graduated', 'Transferred inside', 'Transferred away', 'Transferred to'],
      programmeTableStats: {},
    },
    graduationInfo: {
      tableStats: [],
      graphStats: [],
      titles: ['', 'All graduations', 'Bachelors', 'Masters', 'Doctors', 'Others'],
      programmeTableStats: {},
    },
    status: 'DONE',
    lastUpdated: '',
  }

  const programmes = await getProgrammes(code)

  if (programmes) {
    await combineFacultyBasics(allBasics, code, programmes, yearType)
  }
  return res.json(allBasics)
})

router.get('/faculties/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = 'SPECIAL_INCLUDED' // req.query?.special_groups

  if (!code) return res.status(422).end()

  let counts = {}
  let years = []
  let allCredits = {
    id: code,
    years: [],
    tableStats: [],
    graphStats: [],
    programmeTableStats: {},
    programmeNames: {},
    titles: [
      '',
      'Total',
      'Major students credits',
      'Non-major faculty students credits',
      'Non-major other faculty students credits',
      'Non-degree student credits',
    ],
    status: 'DONE',
    lastUpdated: '',
  }
  const programmes = await getProgrammes(code)

  if (programmes) {
    await combineFacultyCredits(allCredits, programmes, yearType, specialGroups, counts, years)
  }
  let majors = []
  let facultyNonMajor = []
  let otherNonMajor = []
  let nonDegree = []

  years.forEach(year => {
    majors.push(counts[year][1])
    facultyNonMajor.push(counts[year][2])
    otherNonMajor.push(counts[year][3])
    nonDegree.push(counts[year][4])
  })

  allCredits.graphStats = [
    { name: 'Major students credits', data: majors },
    { name: 'Non-major faculty students credits', data: facultyNonMajor },
    { name: 'Non-major other faculty students credits', data: otherNonMajor },
    { name: 'Non-degree credits', data: nonDegree },
  ]

  return res.json(allCredits)
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

  const programmes = await await getProgrammes(code)
  if (programmes) {
    await combineFacultyThesisWriters(allThesisWriters, programmes, code, yearType)
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

  const programmes = await await getProgrammes(code) // findFacultyProgrammeCodes(code)
  return res.json(programmes)
})

module.exports = router
