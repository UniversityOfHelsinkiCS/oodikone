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
  updateNoStudents
} = require('../services/updaterService')

router.post('/update/oldest', async (req, res) => {
  const { amount } = req.body
  if (!Number.isInteger(Number(amount))) {
    res.status(400).end()
    return
  }
  try {
    const response = await updateOldestStudents(amount)
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/all', async (req, res) => {
  try {
    const response = await updateAllStudents()
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/active', async (req, res) => {
  try {
    const response = await updateActiveStudents()
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/no_student', async (req, res) => {
  try {
    const response = await updateNoStudents()
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/attainment', async (req, res) => {
  try {
    const response = await updateAttainments()
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/meta', async (req, res) => {
  try {
    const response = await updateMetadata()
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/update/studentlist', async (req, res) => {
  try {
    const response = await updateStudentlist()
    if (response) {
      res.status(200).json('Scheduled')
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
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

router.post('/reschedule/fetched', async (req, res) => {
  try {
    const response = await rescheduleFetched()
    if (response) {
      res.status(200).json('Scheduled')
    }
  } catch (err) {
    res.status(500).json(err)
  }
})

module.exports = router
