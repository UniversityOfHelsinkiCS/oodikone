const router = require('express').Router()

const {
  createStudyProgrammePin,
  getStudyProgrammePins,
  removeStudyProgrammePin,
} = require('../services/studyProgrammePins')

router.get('/', async (req, res) => {
  const userId = req.user.id
  const result = await getStudyProgrammePins(userId)
  return res.json(result)
})

router.post('/', async (req, res) => {
  const userId = req.user.id
  const { programmeCode } = req.body
  if (!programmeCode) {
    return res.status(400).end()
  }
  await createStudyProgrammePin(userId, programmeCode)
  return res.status(201).end()
})

router.delete('/', async (req, res) => {
  const userId = req.user.id
  const { programmeCode } = req.body
  if (!programmeCode) {
    return res.status(400).end()
  }
  await removeStudyProgrammePin(userId, programmeCode)
  return res.status(204).end()
})

module.exports = router
