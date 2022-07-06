const router = require('express').Router()
const { faculties, degreeProgrammeCodesOfFaculty } = require('../services/organisations')
const { combineFacultyCredits, combineFacultyBasics } = require('../services/facultyStats')

router.get('/faculties', async (req, res) => {
  const facultyList = await faculties()
  res.json(facultyList)
})

router.get('/faculties/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()

  let counts = {}
  let years = []
  let allBasics = {
    id: code,
    years: [],
    tableStats: [],
    graphStats: [],
    titles: ['', 'Started studying', 'Graduated'],
    status: 'DONE',
    lastUpdated: '',
  }

  const programmes = await degreeProgrammeCodesOfFaculty(code)
  if (programmes) {
    await combineFacultyBasics(allBasics, programmes, yearType, specialGroups, counts, years)
  }

  let started = []
  let graduated = []
  let away = []
  let to = []

  if (specialGroups === 'SPECIAL_INCLUDED') {
    allBasics.titles = allBasics.titles.concat(['Transferred away', 'Transferred to'])

    years.forEach(year => {
      started.push(counts[year][0])
      graduated.push(counts[year][1])
      away.push(counts[year][2])
      to.push(counts[year][3])
    })

    allBasics.graphStats = [
      { name: 'Started', data: started },
      { name: 'Graduated', data: graduated },
      { name: 'Tranferred away', data: away },
      { name: 'Transferred to', data: to },
    ]
  } else {
    years.forEach(year => {
      started.push(counts[year][0])
      graduated.push(counts[year][1])
    })

    allBasics.graphStats = [
      { name: 'Started', data: started },
      { name: 'Graduated', data: graduated },
    ]
  }

  return res.json(allBasics)
})

router.get('/faculties/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()

  let counts = {}
  let years = []
  let allCredits = {
    id: code,
    years: [],
    tableStats: [],
    graphStats: [],
    titles: ['', 'Total', 'Major students credits', 'Transferred credits'],
    status: 'DONE',
    lastUpdated: '',
  }

  const programmes = await degreeProgrammeCodesOfFaculty(code)
  if (programmes) {
    await combineFacultyCredits(allCredits, programmes, yearType, specialGroups, counts, years)
  }

  let majors = []
  let nonMajor = []
  let nonDegree = []
  let transferred = []

  if (specialGroups === 'SPECIAL_INCLUDED') {
    allCredits.titles.splice.apply(
      allCredits.titles,
      [3, 0].concat(['Non major students credits', 'Non degree students credits'])
    )

    years.forEach(year => {
      majors.push(counts[year][1])
      nonMajor.push(counts[year][2])
      nonDegree.push(counts[year][3])
      transferred.push(counts[year][4])
    })

    allCredits.graphStats = [
      { name: 'Major students credits', data: majors },
      { name: 'Non-major students credits', data: nonMajor },
      { name: 'Non-degree credits', data: nonDegree },
      { name: 'Transferred credits', data: transferred },
    ]
  } else {
    years.forEach(year => {
      majors.push(counts[year][1])
      transferred.push(counts[year][2])
    })

    allCredits.graphStats = [
      { name: 'Major students credits', data: majors },
      { name: 'Transferred credits', data: transferred },
    ]
  }

  return res.json(allCredits)
})

module.exports = router
