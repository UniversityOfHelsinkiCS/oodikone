const router = require('express').Router()

const { roles } = require('../config/roles')
const auth = require('../middleware/auth')
const { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } = require('../services/mailService')
const userService = require('../services/userService')
const logger = require('../util/logger')

router.get('/', auth.roles(['admin']), async (_req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', auth.roles(['admin']), async (_req, res) => {
  res.json(roles)
})

router.get('/:uid', auth.roles(['admin']), async (req, res) => {
  try {
    const { uid } = req.params
    const user = await userService.findOne(uid)
    return res.json(user)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
})

router.post('/modifyaccess', auth.roles(['admin']), async (req, res) => {
  const { username, accessgroups } = req.body
  try {
    await userService.modifyAccess(username, accessgroups)
    res.status(204).end()
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get('/email/preview', auth.roles(['admin']), (_req, res) => {
  const { accessMessageSubject, accessMessageText } = previewNotificationAboutAccessToUser()
  res.json({ subject: accessMessageSubject, html: accessMessageText })
})

router.post('/email', auth.roles(['admin']), async (req, res) => {
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

router.post('/:uid/elements', auth.roles(['admin']), async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, true)
  res.status(204).end()
})

router.delete('/:uid/elements', auth.roles(['admin']), async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  await userService.modifyElementDetails(uid, codes, false)
  res.status(204).end()
})

router.post('/language', async (req, res) => {
  const {
    body: { language },
    user: { username },
  } = req
  if (!['fi', 'sv', 'en'].includes(language)) {
    return res.status(400).json('invalid language')
  }
  try {
    await userService.updateUser(username, { language })
    return res.status(204).end()
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
})

module.exports = router
