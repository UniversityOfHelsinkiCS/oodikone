const router = require('express').Router()
const { faculties } = require('../services/organisations')
const { combineFacultyBasics } = require('../services/faculty/facultyBasics')
const { combineFacultyCredits } = require('../services/faculty/facultyCredits')
const { findFacultyProgrammeCodes } = require('../services/faculty/faculty')
const { combineFacultyThesisWriters } = require('../services/faculty/facultyThesisWriters')
const { countGraduationTimes } = require('../services/faculty/facultyGraduationTimes')
const { updateFacultyOverview } = require('../services/faculty/facultyUpdates')
const { getFacultyStudentProgress } = require('../services/faculty/facultyStudentProgress')
//const { getFacultyStudents } = require('../services/faculty/facultyStudents')

const {
  getFacultyProgrammes,
  setFacultyProgrammes,
  getBasicStats,
  setBasicStats,
  getCreditStats,
  setCreditStats,
  getThesisWritersStats,
  setThesisWritersStats,
} = require('../services/faculty/facultyService')
const logger = require('../util/logger')

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

const getProgrammes = async (code, programmeFilter) => {
  const programmes = await getFacultyProgrammes(code, programmeFilter)
  if (programmes) return programmes
  let updatedProgrammes = await findFacultyProgrammeCodes(code, programmeFilter)
  if (updatedProgrammes) updatedProgrammes = await setFacultyProgrammes(code, updatedProgrammes, programmeFilter)

  return updatedProgrammes
}

router.get('/', async (req, res) => {
  const ignore = ['Y', 'H99', 'Y01', 'H92', 'H930']
  const facultyList = (await faculties()).filter(f => !ignore.includes(f.code))
  facultyList.sort((a, b) => (a.name.fi > b.name.fi ? 1 : -1))
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
  const specialGroups = req.query?.special_groups
  const programmeFilter = req.query?.programme_filter

  if (!code) return res.status(422).end()

  const data = await getCreditStats(code, yearType, programmeFilter, specialGroups)
  if (data) return res.json(data)

  const programmes = await getProgrammes(code, programmeFilter)
  if (!programmes) return res.status(422).end()

  let updatedStats = await combineFacultyCredits(code, programmes.data, yearType, specialGroups)
  if (updatedStats) {
    updatedStats = await setCreditStats(updatedStats, yearType, programmeFilter, specialGroups)
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

  // const programmes = await getProgrammes(code, programmeFilter)
  const result = await countGraduationTimes(code, programmeFilter)
  // currently counts all programmes
  return res.json(result)
})

router.get('/:id/progressstats', async (req, res) => {
  const faculty = req.params.id
  const programmeFilter = req.query.programme_filter

  if (!faculty) return res.status(422).end()
  const programmes = await getProgrammes(faculty, programmeFilter)
  const progressStats = await getFacultyStudentProgress(faculty, programmes)
  return res.json(progressStats)
})

// router.get('/:id/studentstats', async (req, res) => {
//   const code = req.params.id
//   const programmeFilter = req.query.programme_filter

//   if (!code) return res.status(422).end()
//   const programmes = await getProgrammes(code, programmeFilter)
//   const studentStats = await getFacultyStudents(code, programmes)
//   return res.json(studentStats)
// })

router.get('/:id/update_basicview', async (req, res) => {
  const code = req.params.id
  const statsType = req.query?.stats_type
  if (code) {
    let result = null
    try {
      result = await updateFacultyOverview(code, statsType)
    } catch (e) {
      logger.error(`Failed to update faculty ${code} basic tab stats for ${statsType}: ${e}`)
    }
    return res.json(result)
  }
  return res.status(422).end()
})
module.exports = router
