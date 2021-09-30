const router = require('express').Router()
const { logger } = require('../util/logger')
const { getAllGroupsAndStudents } = require('../services/studyGuidanceGroups')

router.get('/', async (req, res) => {
  const {
    decodedToken: { uid, sisPersonId },
  } = req
  if (!sisPersonId) {
    logger.error(`User ${uid} tried to get person groups but personId was ${sisPersonId} in header`)
    return res.status(400).json({ error: 'Not possible to get groups without personId' })
  }
  return res.json(await getAllGroupsAndStudents(sisPersonId))
})

module.exports = router
