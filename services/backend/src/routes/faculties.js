const router = require('express').Router()
const { faculties, degreeProgrammeCodesOfFaculty } = require('../services/organisations')
const { getCreditStats, setCreditStats } = require('../services/analyticsService')
const { getCreditStatsForStudytrack } = require('../services/studyprogrammeCredits')

router.get('/faculties', async (req, res) => {
  const facultyList = await faculties()
  res.json(facultyList)
})

router.get('/faculties/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()

  let allCredits = {
    id: code,
    years: [],
    tableStats: [],
    graphStats: [],
    titles: [
      '',
      'Total',
      'Major students credits',
      'Non major students credits',
      'Non degree students credits',
      'Transferred credits',
    ],
    status: 'DONE',
    lastUpdated: '',
  }

  let counts = {}
  let years = []
  let majors = []
  let nonMajor = []
  let nonDegree = []
  let transferred = []

  const programmes = await degreeProgrammeCodesOfFaculty(code)
  // get programme grades and combine them per year
  if (programmes) {
    for (const prog of programmes) {
      const data = await getProgrammeCredits(prog, yearType, specialGroups)
      if (data) {
        if (!allCredits.lastUpdated) allCredits.lastUpdated = data.lastUpdated
        data.tableStats.forEach(row => {
          if (!(row[0] in counts)) {
            counts[row[0]] = row.slice(1)
            years.push(row[0])
          } else {
            counts[row[0]] = row.slice(1).map((value, i) => {
              return counts[row[0]][i] + value
            })
          }
        })
      }
    }
  }

  // save table stats and graph stats
  years.forEach(year => {
    allCredits.tableStats.push([year, ...counts[year]])
  })

  years.sort()
  allCredits.years = years

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

  return res.json(allCredits)
})

const getProgrammeCredits = async (code, yearType, specialGroups) => {
  const data = await getCreditStats(code, yearType, specialGroups)
  if (data) return data
  const updatedStats = await getCreditStatsForStudytrack({
    studyprogramme: code,
    settings: {
      isAcademicYear: yearType === 'ACADEMIC_YEAR',
      includeAllSpecials: specialGroups === 'SPECIAL_INCLUDED',
    },
  })
  if (!updatedStats) return undefined
  await setCreditStats(updatedStats, yearType, specialGroups)
  return updatedStats
}

module.exports = router
