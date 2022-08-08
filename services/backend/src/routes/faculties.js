const router = require('express').Router()
const { faculties, degreeProgrammeCodesOfFaculty } = require('../services/organisations')
const { combineFacultyBasics } = require('../services/facultyBasics')
const { combineFacultyCredits } = require('../services/facultyCredits')

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

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
    studentInfo: {
      tableStats: [],
      graphStats: [],
      titles: ['', 'Started studying', 'All graduated', 'Transferred inside', 'Transferred away', 'Transferred to'],
    },
    graduationInfo: {
      tableStats: [],
      graphStats: [],
      titles: ['All graduated', 'Graduated bachelors', 'Graduated masters', 'Graduated doctors', 'Other graduations'],
    },
    startedProgrammes: {},
    status: 'DONE',
    lastUpdated: '',
  }

  const programmes = await degreeProgrammeCodesOfFaculty(code)
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

  const programmes = await degreeProgrammeCodesOfFaculty(code)

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

module.exports = router
