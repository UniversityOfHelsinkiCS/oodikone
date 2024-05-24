const router = require('express').Router()
const userService = require('../services/userService')
const { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } = require('../services/mailservice')
const logger = require('../util/logger')

router.get('/', async (_req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', async (_req, res) => {
  res.json(userService.roles)
})

router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params
    const user = await userService.findOne(uid)
    return res.json(user)
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
})

router.post('/modifyaccess', async (req, res) => {
  const { username, accessgroups } = req.body
  try {
    await userService.modifyAccess(username, accessgroups)
    res.status(204).end()
  } catch (e) {
    res.status(400).json(e)
  }
})

router.get('/email/preview', (_req, res) => {
  const { accessMessageSubject, accessMessageText } = previewNotificationAboutAccessToUser()
  res.json({ subject: accessMessageSubject, html: accessMessageText })
})

router.post('/email', async (req, res) => {
  const userEmail = req.body.email
  if (!userEmail) {
    return res.status(400).json({ error: 'email is missing' })
  }

  const result = await sendNotificationAboutAccessToUser(userEmail)
  if (result.error) {
    return res.status(400).json(result).end()
  }
  logger.info('Succesfully sent message about oodikone access to user')
  res.status(200).end()
})

router.post('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, true)
  res.status(204).end()
})

router.delete('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, false)
  res.status(204).end()
})

module.exports = router
