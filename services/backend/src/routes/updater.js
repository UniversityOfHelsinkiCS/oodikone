const router = require('express').Router()
const {
  updateSISMetadata,
  updateSISStudents,
  updateSISProgrammes,
  updateSISRedisCache,
  updateStudentsByStudentNumber,
  abort,
  updateCoursesByCourseCode,
} = require('../services/sisUpdaterService')
const {
  refreshStatistics,
  refreshTrends,
  refreshFaculties,
  refreshNewOverviews,
  refreshLanguageCenterData,
} = require('../events')

router.get('/update/v2/meta', async (req, res) => {
  const response = await updateSISMetadata(req)
  if (response) {
    res.status(200).json('Update SIS meta scheduled')
  }
})

router.get('/update/v2/students', async (req, res) => {
  const response = await updateSISStudents()
  if (response) {
    res.status(200).json('Update SIS students scheduled')
  }
})

router.post('/update/v2/students', async (req, res) => {
  const response = await updateStudentsByStudentNumber(req.body)
  if (response) {
    res.status(200).json('Update SIS students scheduled')
  }
})

router.post('/update/v2/courses', async (req, res) => {
  const response = await updateCoursesByCourseCode(req.body)
  if (response) {
    res.status(200).json('Update SIS courses scheduled')
  }
})

router.get('/update/v2/programmes', async (req, res) => {
  const response = await updateSISProgrammes()
  if (response) {
    res.status(200).json('Update SIS programmes scheduled')
  }
})

router.get('/refresh_redis_cache', async (req, res) => {
  const response = await updateSISRedisCache()
  if (response) {
    res.status(200).json('Refreshing SIS redis cache scheduled')
  }
})

router.post('/refresh_statistic_v2', async (req, res) => {
  await refreshStatistics()
  res.status(200).json('Teacher and study programme statistics refreshed')
})

router.post('/refresh_study_programmes_v2', async (req, res) => {
  await refreshNewOverviews()
  res.status(200).json('New study programme overviews refreshed')
})

router.post('/refresh_faculties_v2', async (req, res) => {
  await refreshFaculties()
  res.status(200).json('Faculties refreshed')
})

router.post('/refresh_trends', async (req, res) => {
  await refreshTrends()
  res.status(200).json('Trends refreshed')
})

router.post('/refresh_language_center_data', async (req, res) => {
  await refreshLanguageCenterData()
  res.status(200).json('Language center data refreshed')
})

router.get('/abort', async (req, res) => {
  await abort()
  res.status(200).json()
})

module.exports = router
