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
const { refreshStatistics } = require('../events')

router.get('/update/v2/meta', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')

  try {
    const response = await updateSISMetadata(req)
    if (response) {
      res.status(200).json('Update SIS meta scheduled')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

router.get('/update/v2/students', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')

  try {
    const response = await updateSISStudents()
    if (response) {
      res.status(200).json('Update SIS students scheduled')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

router.post('/update/v2/students', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')

  try {
    const response = await updateStudentsByStudentNumber(req.body)
    if (response) {
      res.status(200).json('Update SIS students scheduled')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

router.post('/update/v2/courses', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')

  try {
    const response = await updateCoursesByCourseCode(req.body)
    if (response) {
      res.status(200).json('Update SIS courses scheduled')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

router.get('/update/v2/programmes', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')

  try {
    const response = await updateSISProgrammes()
    if (response) {
      res.status(200).json('Update SIS programmes scheduled')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

router.get('/refresh_redis_cache', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')

  try {
    const response = await updateSISRedisCache()
    if (response) {
      res.status(200).json('Refreshing SIS redis cache scheduled')
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

router.post('/refresh_statistic_v2', async (req, res) => {
  try {
    refreshStatistics()
    res.status(200).json('Refreshing sis statistics')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'error' })
  }
})

router.get('/abort', async (req, res) => {
  try {
    await abort()
    res.status(200).json()
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'error' })
  }
})

module.exports = router
