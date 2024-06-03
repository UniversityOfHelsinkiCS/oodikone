const router = require('express').Router()

const auth = require('../middleware/auth')
const { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } = require('../services/mailservice')
const userService = require('../services/userService')
const logger = require('../util/logger')

router.get('/', auth.roles(['admin']), async (_req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', auth.roles(['admin']), async (_req, res) => {
  res.json(userService.roles)
})

router.get('/:uid', auth.roles(['admin']), async (req, res) => {
  try {
    const { uid } = req.params
    const user = await userService.findOne(uid)
    return res.json(user)
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
})

router.post('/modifyaccess', auth.roles(['admin']), async (req, res) => {
  const { username, accessgroups } = req.body
  try {
    await userService.modifyAccess(username, accessgroups)
    res.status(204).end()
  } catch (e) {
    res.status(400).json(e)
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
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
})

router.get('/get-from-sisu-by-eppn/:eppn', auth.roles(['admin']), async (req, res) => {
  const { eppn } = req.params
  const person = await userService.getUserFromSisuByEppn(eppn, eppn)
  res.json(person)
})

module.exports = router
