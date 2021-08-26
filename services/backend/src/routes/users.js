const router = require('express').Router()
const userService = require('../services/userService')
const blacklist = require('../services/blacklist')
const { userDataCache } = require('../services/cache')
const { sendNotificationAboutAccessToUser, previewNotificationAboutAccessToUser } = require('../services/mailservice')

const addUserToBlacklist = async (user, decodedToken) => {
  if (user) {
    const { username } = user
    userDataCache.del(username)
    if (username != decodedToken.userId) await blacklist.addUserToBlacklist(username)
  }
}

router.get('/', async (req, res) => {
  const results = await userService.findAll()
  res.json(results)
})

router.get('/access_groups', async (req, res) => {
  const result = await userService.getAccessGroups()
  res.json(result)
})

router.post('/modifyaccess', async (req, res) => {
  try {
    const { uid } = req.body
    const result = await userService.modifyAccess(req.body)
    const user = await userService.byId(uid)
    await addUserToBlacklist(user, req.decodedToken)
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
  console.log('Message sent successfully')
  res.status(200).end()
})

router.post('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.enableElementDetails(uid, codes)
  await addUserToBlacklist(user, req.decodedToken)
  res.json(user)
})

router.delete('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.removeElementDetails(uid, codes)
  await addUserToBlacklist(user, req.decodedToken)
  res.json(user)
})

router.post('/:uid/faculties', async (req, res) => {
  const { uid } = req.params
  const { faculties } = req.body
  const user = await userService.setFaculties(uid, faculties)
  await addUserToBlacklist(user, req.decodedToken)
  res.json(user)
})

module.exports = router
