const router = require('express').Router()
const {
  updateOldestStudents,
  getStatuses,
  updateActiveStudents,
  updateAllStudents,
  updateAttainments,
  updateMetadata,
  updateStudentlist,
  rescheduleScheduled,
  rescheduleFetched,
  updateNoStudents,
  updateDaily
} = require('../services/updaterService')
const {
  updateSISMetadata,
  updateSISStudents,
  updateSISStudentsByProgramme,
  updateSISProgrammes,
  updateSISRedisCache,
  updateStudentsByStudentNumber,
  abort,
  updateCoursesByCourseCode
} = require('../services/sisUpdaterService')
const { refreshStatistics, refreshStatisticsV2 } = require('../events')

router.post('/update/oldest', async (req, res) => {
  const { amount } = req.body
  if (!Number.isInteger(Number(amount))) {
    res.status(400).end()
    return
  }
  try {
    const response = await updateOldestStudents(amount)
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/all', async (req, res) => {
  try {
    const response = await updateAllStudents()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/active', async (req, res) => {
  try {
    const response = await updateActiveStudents()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/no_student', async (req, res) => {
  try {
    const response = await updateNoStudents()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/attainment', async (req, res) => {
  try {
    const response = await updateAttainments()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/meta', async (req, res) => {
  try {
    const response = await updateMetadata()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/studentlist', async (req, res) => {
  try {
    const response = await updateStudentlist()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.get('/status', async (req, res) => {
  try {
    const statuses = await getStatuses()
    res.status(200).json(statuses)
  } catch (err) {
    console.log(err)
    res.status(500).json([{ label: 'request status', value: 'request failed' }])
  }
})

router.post('/reschedule/scheduled', async (req, res) => {
  try {
    const response = await rescheduleScheduled()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/reschedule/fetched', async (req, res) => {
  try {
    const response = await rescheduleFetched()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/daily', async (req, res) => {
  try {
    const response = await updateDaily()
    if (response) {
      res.status(200).json({ ...response })
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/refresh_statistics', async (req, res) => {
  try {
    refreshStatistics()
    res.status(200).json('Refreshing statistics')
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'error' })
  }
})

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

router.post('/update/v2/students_by_programme', async (req, res) => {
  const { roles } = req
  if (!roles.includes('dev')) return res.status(403).send('No rights, please stop')
  try {
    const response = await updateSISStudentsByProgramme(req.body)
    if (response) {
      const { year, programme } = req.body
      res.status(200).json(`Update for ${programme} ${year} scheduled`)
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
    refreshStatisticsV2()
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
