const router = require('express').Router()
const userService = require('../services/userService')
const mailservice = require('../services/mailservice')
const blacklist = require('../services/blacklist')

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
    if (user && user.username != req.decodedToken.userId) await blacklist.addUserToBlacklist(user.username)
    res.status(200).json(result)
  } catch (e) {
    res.status(400).json(e)
  }
})

router.post('/email', async (req, res) => {
  const email = req.body.email
  if (process.env.SMTP !== undefined && email) {
    const message = mailservice.message2(email)
    await mailservice.transporter.sendMail(message, (error) => {
      if (error) {
        console.log('Error occurred')
        res.status(400).end()
      } else {
        console.log('Message sent successfully!')
        res.status(200).end()
      }
      mailservice.transporter.close()
    })
  }
})

router.post('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.enableElementDetails(uid, codes)
  if (user && user.username != req.decodedToken.userId) await blacklist.addUserToBlacklist(user.username)
  res.json(user)
})

router.delete('/:uid/elements', async (req, res) => {
  const { uid } = req.params
  const { codes } = req.body
  const user = await userService.removeElementDetails(uid, codes)
  if (user && user.username != req.decodedToken.userId) await blacklist.addUserToBlacklist(user.username)
  res.json(user)
})

router.post('/:uid/faculties', async (req, res) => {
  const { uid } = req.params
  const { faculties } = req.body
  const user = await userService.setFaculties(uid, faculties)
  if (user && user.username != req.decodedToken.userId) await blacklist.addUserToBlacklist(user.username)
  res.json(user)
})

module.exports = router