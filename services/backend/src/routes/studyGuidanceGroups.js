const router = require('express').Router()
const { logger } = require('../util/logger')
const { getAllGroupsAndStudents, changeGroupTags } = require('../services/studyGuidanceGroups')

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

router.put('/:id/tags', async (req, res) => {
  const {
    decodedToken: { uid, sisPersonId },
    body: tags,
    params: { id: groupId },
  } = req

  if (!sisPersonId) {
    logger.error(`User ${uid} tried to change study guidance group tags but personId was ${sisPersonId} in header`)
    return res.status(400).json({ error: 'Not possible to change groups without personId' })
  }

  const groupsUserHasAccessTo = (await getAllGroupsAndStudents(sisPersonId)).map(group => group.id)

  if (!groupsUserHasAccessTo.includes(groupId)) {
    logger.error(
      `User ${uid} tried to change study guidance group tags, but didn't have permission for the group ${groupId}`
    )
    return res.status(400).json({ error: 'Access denied' })
  }

  await changeGroupTags({ groupId, tags })

  return res.status(200)
})

module.exports = router
