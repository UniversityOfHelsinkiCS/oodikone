const router = require('express').Router()
const userService = require('../services/userService')
const { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } = require('../services/mailservice')
const logger = require('../util/logger')

router.get('/', async (req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', async (req, res) => {
  const result = await userService.getAccessGroups()
  res.json(result)
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
  try {
    const result = await userService.modifyAccess(req.body)
    res.status(200).json(result)
  } catch (e) {
    res.status(400).json(e)
  }
})

router.get('/email/preview', (req, res) => {
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
  const user = await userService.enableElementDetails(uid, codes)
  res.json(user)
})

router.delete('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.removeElementDetails(uid, codes)
  res.json(user)
})

router.post('/:uid/faculties', async (req, res) => {
  const { uid } = req.params
  const { faculties } = req.body
  const user = await userService.setFaculties(uid, faculties)
  res.json(user)
})

module.exports = router
