const {
  createStudyProgrammePin,
  getStudyProgrammePins,
  removeStudyProgrammePin,
} = require('../services/studyProgrammePins')

const router = require('express').Router()

router.get('/', async (req, res) => {
  const userId = req.user.id
  const result = await getStudyProgrammePins(userId)
  res.json(result)
})

router.post('/', async (req, res) => {
  const userId = req.user.id
  const { programmeCode } = req.body
  await createStudyProgrammePin(userId, programmeCode)
  res.json({ programmeCode })
})

router.delete('/', async (req, res) => {
  const userId = req.user.id
  const { programmeCode } = req.body
  await removeStudyProgrammePin(userId, programmeCode)
  res.json({ programmeCode })
})

module.exports = router
