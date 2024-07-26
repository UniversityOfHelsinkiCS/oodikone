const router = require('express').Router()

const auth = require('../middleware/auth')
const { getDegreeProgrammesOfFaculty } = require('../services/faculty/faculty')
const { combineFacultyBasics } = require('../services/faculty/facultyBasics')
const { getFacultyCredits } = require('../services/faculty/facultyCredits')
const { countGraduationTimes } = require('../services/faculty/facultyGraduationTimes')
const { getSortedFaculties } = require('../services/faculty/facultyHelpers')
const {
  getProgrammes,
  getBasicStats,
  setBasicStats,
  getThesisWritersStats,
  setThesisWritersStats,
  getGraduationStats,
  setGraduationStats,
  getFacultyStudentStats,
  setFacultyStudentStats,
  getFacultyProgressStats,
  setFacultyProgressStats,
} = require('../services/faculty/facultyService')
const { combineFacultyStudentProgress } = require('../services/faculty/facultyStudentProgress')
const { combineFacultyStudents } = require('../services/faculty/facultyStudents')
const { combineFacultyThesisWriters } = require('../services/faculty/facultyThesisWriters')
const { updateFacultyOverview, updateFacultyProgressOverview } = require('../services/faculty/facultyUpdates')
const logger = require('../util/logger')

// Faculty uses a lot of tools designed for Study programme.
// Some of them have been copied here and slightly edited for faculty purpose.

router.get('/', async (_req, res) => {
  const faculties = await getSortedFaculties()
  res.json(faculties)
})

router.get('/:id/basicstats', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
  const code = req.params.id
  const yearType = req.query?.year_type
  const programmeFilter = req.query?.programme_filter
  const specialGroups = req.query?.special_groups

  if (!code) return res.status(422).end()
  const data = await getBasicStats(code, yearType, programmeFilter, specialGroups)
  if (data) return res.json(data)
  const wantedProgrammes = await getProgrammes(code, programmeFilter)
  if (!wantedProgrammes) return res.status(422).end()

  // all programmes are required for correct sorting of transfers
  const allProgrammeCodes = []
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

router.get('/:id/creditstats', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
  const code = req.params.id
  const { year_type: yearType } = req.query
  const stats = await getFacultyCredits(code, yearType === 'ACADEMIC_YEAR')
  return res.json(stats)
})

router.get('/:id/thesisstats', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
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

router.get('/:id/graduationtimes', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
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

router.get('/:id/progressstats', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
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

router.get('/:id/studentstats', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
  const code = req.params.id
  const specialGroups = req.query?.special_groups
  const graduated = req.query?.graduated

  if (!code) return res.status(422).end()
  const data = await getFacultyStudentStats(code, specialGroups, graduated)
  if (data) return res.json(data)
  const newProgrammes = await getDegreeProgrammesOfFaculty(code, true)
  if (!newProgrammes.length) return res.status(422).end()

  let updateStats = await combineFacultyStudents(code, newProgrammes, specialGroups, graduated)
  if (updateStats) {
    updateStats = await setFacultyStudentStats(updateStats, specialGroups, graduated)
  }
  return res.json(updateStats)
})

router.get('/:id/update_basicview', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
  const code = req.params.id
  const statsType = req.query?.stats_type
  if (!code) {
    return res.status(400).json({ error: 'Missing code' })
  }
  try {
    const result = await updateFacultyOverview(code, statsType)
    return res.json(result)
  } catch (error) {
    const message = `Failed to update basic stats for faculty ${code}`
    logger.error(message, { error })
    return res.status(500).json({ error: message })
  }
})

router.get('/:id/update_progressview', auth.roles(['facultyStatistics', 'katselmusViewer']), async (req, res) => {
  const code = req.params.id
  if (!code) {
    return res.status(400).json({ error: 'Missing code' })
  }
  try {
    const result = await updateFacultyProgressOverview(code)
    return res.json(result)
  } catch (error) {
    const message = `Failed to update progress tab stats for faculty ${code}`
    logger.error(message, { error })
    return res.status(500).json({ error: message })
  }
})

module.exports = router
