const router = require('express').Router()

const { refreshFaculties, refreshProgrammes } = require('../events')
const {
  abort,
  updateCoursesByCourseCode,
  updateSISMetadata,
  updateSISProgrammes,
  updateSISRedisCache,
  updateSISStudents,
  updateStudentsByStudentNumber,
} = require('../services/sisUpdaterService')
const logger = require('../util/logger')
const { jobMaker, getJobs } = require('../worker/queue')

const refreshFacultiesByList = list => {
  list.forEach(code => jobMaker.faculty(code))
  return 'Added jobs for refreshing faculties'
}

const refreshProgrammesByList = list => {
  list.forEach(code => jobMaker.programme(code))
  return 'Added jobs for refreshing programme'
}

router.get('/update/v2/meta', async (req, res) => {
  const response = await updateSISMetadata(req)
  if (response) {
    res.status(200).json('Update SIS meta scheduled')
  }
})

router.get('/update/v2/students', async (_req, res) => {
  const response = await updateSISStudents()
  if (response) {
    res.status(200).json('Update SIS students scheduled')
  }
})

router.post('/update/v2/customlist/:type', async (req, res) => {
  const { type } = req.params
  const list = req.body
  const typeToJob = {
    students: updateStudentsByStudentNumber,
    courses: updateCoursesByCourseCode,
    faculties: refreshFacultiesByList,
    programmes: refreshProgrammesByList,
  }
  if (typeof typeToJob[type] !== 'function') return res.status(400).json('Bad job type')
  const response = await typeToJob[type](list)

  if (response) {
    res.status(200).json('Scheduled custom list')
  }
})

router.post('/update/v2/courses', async (req, res) => {
  const response = await updateCoursesByCourseCode(req.body)
  if (response) {
    res.status(200).json('Update SIS courses scheduled')
  }
})

router.get('/update/v2/programmes', async (_req, res) => {
  const response = await updateSISProgrammes()
  if (response) {
    res.status(200).json('Update SIS programmes scheduled')
  }
})

router.get('/refresh_redis_cache', async (req, res) => {
  logger.info(`${req.user.username} requested refresh of redis cache`)
  const response = await updateSISRedisCache()
  if (response) {
    res.status(200).json('Refreshing SIS redis cache scheduled')
  }
})

router.post('/refresh_statistic_v2', async (req, res) => {
  logger.info(`${req.user.username} requested refresh of statistics`)
  jobMaker.statistics()
  res.status(200).json('Teacher and study programme statistics refreshed')
})

router.post('/refresh_study_programmes_v2', async (req, res) => {
  logger.info(`${req.user.username} requested refresh of study programmes`)
  refreshProgrammes()
  res.status(200).json('Added job for refreshing study programme overviews')
})

router.post('/refresh_faculties_v2', async (req, res) => {
  logger.info(`${req.user.username} requested refresh of faculties`)
  refreshFaculties()
  res.status(200).json('Added job for refreshing faculties')
})

router.post('/refresh_language_center_data', async (req, res) => {
  logger.info(`${req.user.username} requested refresh of language center data`)
  jobMaker.languagecenter()
  res.status(200).json('Added job for refreshing language center data')
})

router.post('/refresh-close-to-graduation', async (req, res) => {
  logger.info(`${req.user.username} requested refresh of close to graduation data`)
  jobMaker.closeToGraduation()
  res.status(200).json('Added job for refreshing close to graduation data')
})

router.get('/abort', async (_req, res) => {
  await abort()
  res.status(200).json()
})

router.get('/jobs', async (_req, res) => {
  const waiting = await getJobs('waiting')
  const active = await getJobs('active')
  res.status(200).json({ waiting, active })
})

module.exports = router
