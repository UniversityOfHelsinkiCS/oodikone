const router = require('express').Router()
const userService = require('../services/userService')
const mailservice = require('../services/mailservice')
const blacklist = require('../services/blacklist')
const { userDataCache } = require('../services/cache')

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
  const { subject, html } = mailservice.message2(null)
  res.json({ subject, html })
})

router.post('/email', async (req, res) => {
  if (!process.env.SMTP) {
    return res.status(500).json({ error: 'Email system has not been configured' })
  }

  const email = req.body.email
  if (!email) {
    return res.status(400).json({ error: 'email is missing' })
  }

  const message = mailservice.message2(email)
  try {
    const info = await mailservice.transporter.sendMail(message)
    console.log('Message sent successfully', info)
    res.status(200).end()
  } catch (e) {
    console.error('Error occurred while sending user email', e)
    res.status(500).json({ error: e.message })
  }
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
