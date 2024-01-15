const router = require('express').Router()
const { faculties } = require('../services/organisations')
const { combineFacultyBasics } = require('../services/faculty/facultyBasics')
const { combineFacultyCredits } = require('../services/faculty/facultyCredits')
const { combineFacultyThesisWriters } = require('../services/faculty/facultyThesisWriters')
const { countGraduationTimes } = require('../services/faculty/facultyGraduationTimes')
const { updateFacultyOverview, updateFacultyProgressOverview } = require('../services/faculty/facultyUpdates')
const { combineFacultyStudentProgress } = require('../services/faculty/facultyStudentProgress')
const { combineFacultyStudents } = require('../services/faculty/facultyStudents')
const {
  getProgrammes,
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getThesisWritersStats,
  setThesisWritersStats,
  getGraduationStats,
  setGraduationStats,
  getFacultyStudentStats,
  setFacultyStudentStats,
  getFacultyProgressStats,
  setFacultyProgressStats,
} = require('../services/faculty/facultyService')
const logger = require('../util/logger')

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

const getFacultyList = async () => {
  const ignore = ['Y', 'H99', 'Y01', 'H92', 'H930']
  const facultyList = (await faculties()).filter(f => !ignore.includes(f.code))
  facultyList.sort((a, b) => (a.name.fi > b.name.fi ? 1 : -1))
  return facultyList
}

router.get('/', async (req, res) => {
  const facultyList = await getFacultyList()
  res.json(facultyList)
})

router.get('/:id/basicstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const programmeFilter = req.query?.programme_filter
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()
  const data = await getBasicStats(code, yearType, programmeFilter, specialGroups)
  if (data) return res.json(data)
  const wantedProgrammes = await getProgrammes(code, programmeFilter)
  if (!wantedProgrammes) return res.status(422).end()

  //all programmes are required for correct sorting of transfers
  let allProgrammeCodes = []
  if (programmeFilter === 'NEW_STUDY_PROGRAMMES') {
    const allProgs = await getProgrammes(code, 'ALL_PROGRAMMES')
    allProgs?.data.forEach(prog => allProgrammeCodes.push(prog.code))
  } else {
    wantedProgrammes?.data.forEach(prog => allProgrammeCodes.push(prog.code))
  }

  let updatedStats = await combineFacultyBasics(
    code,
    wantedProgrammes.data,
    yearType,
    allProgrammeCodes,
    programmeFilter,
    specialGroups
  )
  if (updatedStats) {
    updatedStats = await setBasicStats(updatedStats, yearType, programmeFilter, specialGroups)
  }
  return res.json(updatedStats)
})

router.get('/:id/creditstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const programmeFilter = req.query?.programme_filter

  if (!code) return res.status(422).end()
  const data = await getCreditStats(code, yearType, programmeFilter)
  if (data) return res.json(data)

  const programmes = await getProgrammes(code, programmeFilter)
  if (!programmes) return res.status(422).end()

  // list of all programmes is also needed in classification of credits
  const allProgrammes = programmeFilter === 'ALL_PROGRAMMES' ? programmes : await getProgrammes(code, 'ALL_PROGRAMMES')

  let updatedStats = await combineFacultyCredits(code, programmes.data, allProgrammes.data, yearType)
  if (updatedStats) {
    updatedStats = await setCreditStats(updatedStats, yearType, programmeFilter)
  }

  return res.json(updatedStats)
})

router.get('/:id/thesisstats', async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const specialGroups = req.query?.special_groups
  const programmeFilter = req.query?.programme_filter

  if (!code) return res.status(422).end()
  const data = await getThesisWritersStats(code, yearType, programmeFilter, specialGroups)
  if (data) return res.json(data)
  const programmes = await getProgrammes(code, programmeFilter)
  if (!programmes) return res.status(422).end()
  let updateStats = await combineFacultyThesisWriters(code, programmes.data, yearType, specialGroups)
  if (updateStats) {
    updateStats = await setThesisWritersStats(updateStats, yearType, programmeFilter, specialGroups)
  }
  return res.json(updateStats)
})

router.get('/:id/graduationtimes', async (req, res) => {
  const code = req.params.id
  const programmeFilter = req.query?.programme_filter

  if (!code) return res.status(422).end()
  const data = await getGraduationStats(code, programmeFilter)
  if (data) {
    return res.json(data)
  }
  let updatedStats = await countGraduationTimes(code, programmeFilter)
  if (updatedStats) {
    updatedStats = await setGraduationStats(updatedStats, programmeFilter)
  }
  return res.json(updatedStats)
})

router.get('/:id/progressstats', async (req, res) => {
  const code = req.params.id
  const specialGroups = req.query?.special_groups
  const graduated = req.query?.graduated
  const programmes = await getProgrammes(code, 'NEW_STUDY_PROGRAMMES')
  if (!programmes) return res.status(422).end()

  if (!code) return res.status(422).end()
  const data = await getFacultyProgressStats(code, specialGroups, graduated)
  if (data) return res.json(data)

  let updateStats = await combineFacultyStudentProgress(code, programmes.data, specialGroups, graduated)
  if (updateStats) {
    updateStats = await setFacultyProgressStats(updateStats, specialGroups, graduated)
  }
  return res.json(updateStats)
})

router.get('/allprogressstats', async (req, res) => {
  if (!req.user.roles.includes('admin')) {
    return res.status(403).send({ error: 'Feature not yet available to non-admins' })
  }
  const specialGroups = 'SPECIAL_EXCLUDED'
  const graduated = req.query?.graduated
  const allFaculties = await getFacultyList()
  const facultyCodes = allFaculties.map(f => f.code)
  const codeToData = {}

  for (const facultyCode of facultyCodes) {
    const data = await getFacultyProgressStats(facultyCode, specialGroups, graduated)
    if (!data) {
      return res.status(500).end()
    }
    codeToData[facultyCode] = data
  }

  const universityData = {
    years: codeToData.H50.years,
    yearlyBachelorTitles: codeToData.H50.yearlyBachelorTitles,
    programmeNames: allFaculties.reduce((obj, fac) => {
      const { name, ...rest } = fac.dataValues
      obj[fac.code] = { ...rest, ...name }
      return obj
    }, {}),
    bachelorsProgStats: {},
    creditCounts: {
      bachelor: {},
    },
  }

  const unifyProgressStats = progStats => {
    return progStats.reduce(
      (all, prog) => {
        prog.forEach((yearStats, yearIndex) =>
          yearStats.forEach((category, categoryIndex) => {
            all[yearIndex][categoryIndex] += prog[yearIndex][categoryIndex]
          })
        )
        return all
      },
      // eslint-disable-next-line no-unused-vars
      progStats[0].map(year => year.map(_num => 0))
    )
  }
  for (const facultyCode of facultyCodes) {
    const facultyData = codeToData[facultyCode]
    for (const year of universityData.years.slice(1).reverse()) {
      for (const fieldName of ['bachelor', 'bachelorMaster', 'master', 'licentiate', 'doctor']) {
        if (!facultyData.creditCounts[fieldName] || Object.keys(facultyData.creditCounts[fieldName]).length === 0)
          continue
        if (!universityData.creditCounts[fieldName]) universityData.creditCounts[fieldName] = {}
        if (!universityData.creditCounts[fieldName][year]) universityData.creditCounts[fieldName][year] = []
        universityData.creditCounts[fieldName][year].push(...facultyData.creditCounts[fieldName][year])
      }
      for (const fieldName of [
        'bachelorsProgStats',
        'bcMsProgStats',
        'licentiateProgStats',
        'mastersProgStats',
        'doctoralProgStats',
      ]) {
        if (Object.keys(facultyData[fieldName]).length === 0) continue
        if (!universityData[fieldName]) universityData[fieldName] = {}
        universityData[fieldName][facultyCode] = unifyProgressStats(Object.values(facultyData[fieldName]))
      }
    }
  }
  return res.status(200).json(universityData)
})

router.get('/:id/studentstats', async (req, res) => {
  const code = req.params.id
  const specialGroups = req.query?.special_groups
  const graduated = req.query?.graduated

  if (!code) return res.status(422).end()
  const data = await getFacultyStudentStats(code, specialGroups, graduated)
  if (data) return res.json(data)
  const newProgrammes = await getProgrammes(code, 'NEW_STUDY_PROGRAMMES')
  if (!newProgrammes) return res.status(422).end()

  let updateStats = await combineFacultyStudents(code, newProgrammes.data, specialGroups, graduated)
  if (updateStats) {
    updateStats = await setFacultyStudentStats(updateStats, specialGroups, graduated)
  }
  return res.json(updateStats)
})

router.get('/:id/update_basicview', async (req, res) => {
  const code = req.params.id
  const statsType = req.query?.stats_type
  if (code) {
    const result = await updateFacultyOverview(code, statsType)
    return res.json(result)
  }
  return res.status(422).end()
})

router.get('/:id/update_progressview', async (req, res) => {
  const code = req.params.id
  if (code) {
    let result = null
    try {
      result = await updateFacultyProgressOverview(code)
    } catch (e) {
      logger.error(`Failed to update faculty ${code} progress tab stats: ${e}`)
    }
    return res.json(result)
  }
  return res.status(422).end()
})
module.exports = router
